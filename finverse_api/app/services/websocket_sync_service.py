"""
WebSocket Sync Service for FinVerse API
Handles real-time blockchain event synchronization via WebSocket
"""

import asyncio
import json
import logging
from typing import Dict, Any, Optional
from datetime import datetime

try:
    import websockets
    from websockets.exceptions import ConnectionClosed, WebSocketException
    WEBSOCKETS_AVAILABLE = True
except ImportError:
    WEBSOCKETS_AVAILABLE = False
    print("⚠️ WebSockets not available. Install with: pip install websockets")

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.services.blockchain_sync_service import blockchain_sync_service
from app.core.config import settings

logger = logging.getLogger(__name__)

class WebSocketSyncService:
    """WebSocket-based real-time blockchain synchronization service"""
    
    def __init__(self):
        self.websocket_url = "ws://localhost:8546"  # Default WebSocket RPC URL
        self.is_listening = False
        self.websocket = None
        self.reconnect_attempts = 0
        self.max_reconnect_attempts = 10
        self.reconnect_delay = 5  # seconds
        
    async def start_listening(self):
        """Start listening for blockchain events via WebSocket"""
        if not WEBSOCKETS_AVAILABLE:
            logger.warning("WebSockets not available, skipping WebSocket sync")
            return
            
        logger.info("🔄 Starting WebSocket blockchain event listener...")
        
        while self.reconnect_attempts < self.max_reconnect_attempts:
            try:
                await self._connect_and_listen()
            except Exception as e:
                logger.error(f"WebSocket connection failed: {str(e)}")
                self.reconnect_attempts += 1
                
                if self.reconnect_attempts < self.max_reconnect_attempts:
                    logger.info(f"Reconnecting in {self.reconnect_delay} seconds... (attempt {self.reconnect_attempts}/{self.max_reconnect_attempts})")
                    await asyncio.sleep(self.reconnect_delay)
                else:
                    logger.error("Max reconnection attempts reached. WebSocket sync disabled.")
                    break
    
    async def _connect_and_listen(self):
        """Connect to WebSocket and listen for events"""
        if not WEBSOCKETS_AVAILABLE:
            return
            
        try:
            async with websockets.connect(self.websocket_url) as websocket:
                self.websocket = websocket
                self.is_listening = True
                self.reconnect_attempts = 0
                
                logger.info(f"✅ Connected to WebSocket: {self.websocket_url}")
                
                # Subscribe to relevant events
                await self._subscribe_to_events()
                
                # Listen for events
                async for message in websocket:
                    await self._handle_event(message)
                    
        except ConnectionClosed:
            logger.warning("WebSocket connection closed")
            self.is_listening = False
        except WebSocketException as e:
            logger.error(f"WebSocket error: {str(e)}")
            self.is_listening = False
            raise
        except Exception as e:
            logger.error(f"Unexpected error in WebSocket listener: {str(e)}")
            self.is_listening = False
            raise
    
    async def _subscribe_to_events(self):
        """Subscribe to relevant blockchain events"""
        if not self.websocket:
            return
            
        # Subscribe to new block headers
        subscription_request = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "eth_subscribe",
            "params": ["newHeads"]
        }
        
        await self.websocket.send(json.dumps(subscription_request))
        logger.info("📡 Subscribed to new block headers")
        
        # Subscribe to contract logs (if contract addresses are available)
        try:
            if hasattr(settings, 'STAKE_VAULT_ADDRESS'):
                log_subscription = {
                    "jsonrpc": "2.0",
                    "id": 2,
                    "method": "eth_subscribe",
                    "params": [
                        "logs",
                        {
                            "address": settings.STAKE_VAULT_ADDRESS,
                            "topics": []  # Listen to all events from the contract
                        }
                    ]
                }
                await self.websocket.send(json.dumps(log_subscription))
                logger.info(f"📡 Subscribed to contract logs: {settings.STAKE_VAULT_ADDRESS}")
        except Exception as e:
            logger.warning(f"Could not subscribe to contract logs: {str(e)}")
    
    async def _handle_event(self, message: str):
        """Handle incoming WebSocket event"""
        try:
            event_data = json.loads(message)
            
            if "method" in event_data and event_data["method"] == "eth_subscription":
                await self._process_subscription_event(event_data)
            else:
                logger.debug(f"Received non-subscription message: {event_data}")
                
        except json.JSONDecodeError:
            logger.error(f"Failed to decode WebSocket message: {message}")
        except Exception as e:
            logger.error(f"Error handling WebSocket event: {str(e)}")
    
    async def _process_subscription_event(self, event_data: Dict[str, Any]):
        """Process subscription event from blockchain"""
        try:
            params = event_data.get("params", {})
            subscription_id = params.get("subscription")
            result = params.get("result", {})
            
            if "blockNumber" in result:
                # New block event
                await self._handle_new_block(result)
            elif "topics" in result:
                # Contract log event
                await self._handle_contract_log(result)
                
        except Exception as e:
            logger.error(f"Error processing subscription event: {str(e)}")
    
    async def _handle_new_block(self, block_data: Dict[str, Any]):
        """Handle new block event"""
        block_number = block_data.get("number")
        if block_number:
            logger.debug(f"📦 New block: {block_number}")
            
            # Trigger sync check for new transactions
            await self._trigger_sync_check()
    
    async def _handle_contract_log(self, log_data: Dict[str, Any]):
        """Handle contract log event (stake/unstake events)"""
        try:
            topics = log_data.get("topics", [])
            transaction_hash = log_data.get("transactionHash")
            
            logger.info(f"📝 Contract event detected: {transaction_hash}")
            
            # Trigger immediate sync for this specific transaction
            await self._trigger_immediate_sync(transaction_hash)
            
        except Exception as e:
            logger.error(f"Error handling contract log: {str(e)}")
    
    async def _trigger_sync_check(self):
        """Trigger a general sync check"""
        try:
            # Import here to avoid circular imports
            from app.services.blockchain_sync_service import blockchain_sync_service
            
            db = SessionLocal()
            try:
                # Run a quick sync cycle
                result = await blockchain_sync_service.run_sync_cycle(db)
                logger.debug(f"WebSocket-triggered sync result: {result}")
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Error in WebSocket-triggered sync: {str(e)}")
    
    async def _trigger_immediate_sync(self, transaction_hash: str):
        """Trigger immediate sync for a specific transaction"""
        try:
            logger.info(f"🚀 Immediate sync triggered for transaction: {transaction_hash}")
            
            # Store the transaction hash for prioritized processing
            await self._trigger_sync_check()
            
        except Exception as e:
            logger.error(f"Error in immediate sync trigger: {str(e)}")
    
    async def stop_listening(self):
        """Stop WebSocket listener"""
        self.is_listening = False
        
        if self.websocket:
            try:
                await self.websocket.close()
                logger.info("✅ WebSocket connection closed")
            except Exception as e:
                logger.error(f"Error closing WebSocket: {str(e)}")
        
        self.websocket = None
    
    def get_status(self) -> Dict[str, Any]:
        """Get WebSocket service status"""
        return {
            "is_listening": self.is_listening,
            "websocket_url": self.websocket_url,
            "reconnect_attempts": self.reconnect_attempts,
            "max_reconnect_attempts": self.max_reconnect_attempts,
            "websockets_available": WEBSOCKETS_AVAILABLE
        }

# Create singleton instance
websocket_sync_service = WebSocketSyncService()
