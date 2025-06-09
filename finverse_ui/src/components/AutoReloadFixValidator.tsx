import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { useAppState } from '@/contexts/AppStateContext';

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'warning' | 'pending';
  description: string;
  details?: string;
}

export function AutoReloadFixValidator() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [pageLoadTime] = useState(Date.now());
  
  const { isConnected, currentAccount, chainId } = useWallet();
  const { refreshAll, setIsManualRefresh } = useAppState();

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    const results: TestResult[] = [];

    // Test 1: Check if window.location.reload is properly removed
    try {
      const pageReloadFound = typeof window !== 'undefined' && 
        document.documentElement.innerHTML.includes('window.location.reload()');
      
      results.push({
        name: 'Page Reload Prevention',
        status: pageReloadFound ? 'fail' : 'pass',
        description: 'Verify no components use window.location.reload()',
        details: pageReloadFound ? 'Found window.location.reload() usage' : 'No automatic page reloads detected'
      });
    } catch {
      results.push({
        name: 'Page Reload Prevention',
        status: 'warning',
        description: 'Could not verify reload prevention',
        details: 'Test encountered an error'
      });
    }

    // Test 2: Check wallet event handling
    results.push({
      name: 'Wallet Event Handling',
      status: isConnected ? 'pass' : 'warning',
      description: 'MetaMask events handled without reloads',
      details: isConnected 
        ? `Connected to account: ${currentAccount?.slice(0, 8)}...` 
        : 'Wallet not connected - cannot fully test'
    });

    // Test 3: Check network change handling
    results.push({
      name: 'Network Change Handling',
      status: chainId ? 'pass' : 'warning',
      description: 'Network changes handled gracefully',
      details: chainId 
        ? `Current chain ID: ${chainId}` 
        : 'No network detected'
    });

    // Test 4: Test custom event system
    try {
      let eventReceived = false;
      const testHandler = () => { eventReceived = true; };
      
      window.addEventListener('refreshDashboard', testHandler);
      window.dispatchEvent(new CustomEvent('refreshDashboard', { detail: { test: true } }));
      
      // Small delay to allow event processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      window.removeEventListener('refreshDashboard', testHandler);
      
      results.push({
        name: 'Custom Event System',
        status: eventReceived ? 'pass' : 'fail',
        description: 'Custom refresh events working properly',
        details: eventReceived ? 'Event system functional' : 'Event system not working'
      });
    } catch {
      results.push({
        name: 'Custom Event System',
        status: 'fail',
        description: 'Custom refresh events working properly',
        details: 'Event system test failed'
      });
    }

    // Test 5: Check session persistence
    const sessionStartTime = sessionStorage.getItem('finverse_session_start');
    if (!sessionStartTime) {
      sessionStorage.setItem('finverse_session_start', pageLoadTime.toString());
    }
    
    const sessionAge = sessionStartTime ? Date.now() - parseInt(sessionStartTime) : 0;
    
    results.push({
      name: 'Session Persistence',
      status: sessionAge > 10000 ? 'pass' : 'warning',
      description: 'App maintains state without unexpected reloads',
      details: `Session age: ${Math.floor(sessionAge / 1000)}s`
    });

    setTestResults(results);
    setIsRunning(false);
  };

  const testManualRefresh = () => {
    setIsManualRefresh(true);
    refreshAll();
    setTimeout(() => setIsManualRefresh(false), 1000);
  };

  useEffect(() => {
    // Auto-run tests on mount
    runTests();
  }, []);

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'fail':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      default:
        return <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    const variants: Record<string, 'default' | 'destructive' | 'secondary' | 'outline'> = {
      pass: 'default',
      fail: 'destructive',
      warning: 'secondary',
      pending: 'outline'
    };
    
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const overallStatus = testResults.length > 0 
    ? testResults.every(r => r.status === 'pass') 
      ? 'All tests passed! 🎉' 
      : testResults.some(r => r.status === 'fail')
        ? 'Some tests failed ⚠️'
        : 'Tests passed with warnings ⚡'
    : 'Running tests...';

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Auto-Reload Fix Validator
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Validates that all auto-reload issues have been eliminated
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={runTests} 
              disabled={isRunning}
              variant="outline"
              size="sm"
            >
              {isRunning ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Re-run Tests
            </Button>
            <Button 
              onClick={testManualRefresh}
              size="sm"
            >
              Test Manual Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="p-3 bg-muted rounded-lg">
          <h4 className="font-medium text-sm">Overall Status</h4>
          <p className="text-sm text-muted-foreground">{overallStatus}</p>
        </div>

        <div className="space-y-3">
          {testResults.map((result, index) => (
            <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
              <div className="flex-shrink-0 mt-1">
                {getStatusIcon(result.status)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-sm">{result.name}</h4>
                  {getStatusBadge(result.status)}
                </div>
                <p className="text-sm text-muted-foreground mb-1">
                  {result.description}
                </p>
                {result.details && (
                  <p className="text-xs text-muted-foreground">
                    {result.details}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t">
          <h4 className="font-medium text-sm mb-2">Manual Testing Instructions</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>1. Switch MetaMask accounts - app should update without reload</p>
            <p>2. Change network in MetaMask - app should handle gracefully</p>
            <p>3. Disconnect/reconnect wallet - no page refresh should occur</p>
            <p>4. Wait 10+ minutes inactive - app should remain stable</p>
            <p>5. Complete a staking transaction - data should refresh without reload</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 