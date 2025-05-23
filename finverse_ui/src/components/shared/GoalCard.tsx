import React from 'react';
import { 
  Card, 
  CardContent, 
  CardActions,
  Typography, 
  LinearProgress, 
  Box, 
  Chip,
  IconButton,
  Tooltip,
  Grid,
  useTheme,
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  AccessTime as TimeIcon,
  EmojiEvents as GoalDefaultIcon,
} from '@mui/icons-material';
import type { FinancialGoal } from '../../types';
import { motion } from 'framer-motion';

// Mock implementation of date functions if date-fns is not available
const differenceInDays = (date1: Date, date2: Date): number => {
  const diffTime = date1.getTime() - date2.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const parseISO = (dateString: string): Date => new Date(dateString);

interface GoalCardProps {
  goal: FinancialGoal;
  onEdit: (goalId: number) => void;
  onDelete: (goalId: number) => void;
}

const GoalCard: React.FC<GoalCardProps> = ({ goal, onEdit, onDelete }) => {
  const theme = useTheme();
  const progress = Math.min(Math.round((goal.current_amount / goal.target_amount) * 100), 100);
  
  const daysRemaining = differenceInDays(
    parseISO(goal.target_date),
    new Date()
  );
  
  // Helper functions for displaying status and priority
  const getStatusText = (status: number): string => {
    switch (status) {
      case 1: return 'Ongoing';
      case 2: return 'Completed';
      case 3: return 'Cancelled';
      default: return 'Unknown';
    }
  };
  
  const getStatusColor = (status: number): 'primary' | 'success' | 'error' | 'default' => {
    switch (status) {
      case 1: return 'primary';
      case 2: return 'success';
      case 3: return 'error';
      default: return 'default';
    }
  };
  
  const getPriorityText = (priority: number): string => {
    switch (priority) {
      case 1: return 'Low';
      case 2: return 'Medium';
      case 3: return 'High';
      default: return 'Unknown';
    }
  };
  
  const getPriorityColor = (priority: number): string => {
    switch (priority) {
      case 1: return theme.palette.success.main;
      case 2: return theme.palette.warning.main;
      case 3: return theme.palette.error.main;
      default: return theme.palette.grey[500];
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: "easeOut" } },
  };

  const cardHoverEffect = {
    scale: 1.03,
    boxShadow: theme.palette.mode === 'dark' 
      ? `0px 8px 20px -4px rgba(0,0,0,0.35), 0px 5px 12px -5px rgba(0,0,0,0.3)`
      : `0px 8px 20px -4px rgba(100,100,100,0.15), 0px 5px 12px -5px rgba(100,100,100,0.1)`,
    transition: { duration: 0.2, ease: 'easeOut' }
  };

  // Determine icon: use goal.icon, fallback to first letter, then to a default Goal icon
  const goalIconContent = () => {
    if (goal.icon && typeof goal.icon === 'string' && goal.icon.length > 1) {
        return <Typography variant="h5">{goal.icon}</Typography>;
    } 
    if (typeof goal.icon === 'string' && goal.icon.length === 1) {
        return <Typography variant="h5">{goal.icon.toUpperCase()}</Typography>;
    }
    if (goal.name) {
      return <Typography variant="h5">{goal.name.charAt(0).toUpperCase()}</Typography>;
    }
    return <GoalDefaultIcon sx={{ fontSize: '1.5rem' }}/>;
  };

  return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible" whileHover={cardHoverEffect} style={{ height: '100%' }}>
      <Card 
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: theme.shape.borderRadius * 2,
          backgroundColor: theme.palette.mode === 'dark'
            ? 'rgba(30, 30, 40, 0.65)' 
            : 'rgba(255, 255, 255, 0.65)',
          backdropFilter: 'blur(10px) saturate(1.6)',
          WebkitBackdropFilter: 'blur(10px) saturate(1.6)',
          border: '1px solid',
          borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(200,200,200,0.15)',
          borderLeft: `4px solid ${getPriorityColor(goal.priority)}`,
          boxShadow: theme.palette.mode === 'dark'
            ? '0 5px 18px rgba(0,0,0,0.3)'
            : '0 5px 18px rgba(100,100,100,0.12)',
          overflow: 'hidden'
        }}
      >
        <CardContent sx={{ flexGrow: 1, p: { xs: 2, md: 2.5 } }}>
          {/* Goal name and icon */}
          <Box display="flex" alignItems="center" mb={2}>
            <Box 
              sx={{ 
                backgroundColor: goal.color || getPriorityColor(goal.priority),
                minWidth: {xs: 36, md: 40},
                height: {xs: 36, md: 40},
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: theme.palette.getContrastText(goal.color || getPriorityColor(goal.priority)),
                mr: 1.5,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              {goalIconContent()}
            </Box>
            <Typography variant="h6" component="div" sx={{ fontWeight: '600', flexGrow: 1 }} noWrap>
              {goal.name}
            </Typography>
          </Box>
          
          <Grid container spacing={1} justifyContent="space-between" alignItems="center" mb={2}>
            <Grid item>
              <Chip 
                label={getStatusText(goal.status)} 
                color={getStatusColor(goal.status)}
                size="small"
                sx={{ fontWeight: 500, opacity: 0.9 }}
              />
            </Grid>
            <Grid item>
              <Chip 
                label={`Priority: ${getPriorityText(goal.priority)}`}
                sx={{ 
                  backgroundColor: getPriorityColor(goal.priority),
                  color: theme.palette.getContrastText(getPriorityColor(goal.priority)),
                  fontWeight: 500,
                  opacity: 0.9
                }}
                size="small"
              />
            </Grid>
          </Grid>
          
          {/* Amount and progress */}
          <Box mb={1.5}>
            <Grid container justifyContent="space-between" alignItems="baseline" sx={{mb: 0.5}}>
              <Grid item>
                <Typography variant="caption" color="text.secondary" sx={{opacity: 0.8}}>
                  Current Progress
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(goal.current_amount)}
                </Typography>
              </Grid>
              <Grid item textAlign="right">
                <Typography variant="caption" color="text.secondary" sx={{opacity: 0.8}}>
                  Target Amount
                </Typography>
                <Typography variant="subtitle1" fontWeight="500">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(goal.target_amount)}
                </Typography>
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1}}>
              <LinearProgress 
                variant="determinate" 
                value={progress} 
                color={progress >= 100 ? "success" : "primary"}
                sx={{ height: {xs:8, md:10}, borderRadius: theme.shape.borderRadius, flexGrow: 1, bgcolor: 'action.disabledBackground' }}
              />
              <Typography variant="body2" fontWeight="500" sx={{color: progress >=100 ? theme.palette.success.main : theme.palette.primary.main}}>
                {progress}%
              </Typography>
            </Box>
          </Box>
          
          {/* Time remaining */}
          {goal.status === 1 && (
            <Box display="flex" alignItems="center" mt={2} p={1} borderRadius={theme.shape.borderRadius} bgcolor={theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)': 'rgba(0,0,0,0.03)'}>
              <TimeIcon fontSize="small" color="action" sx={{ mr: 1, opacity: 0.7 }} />
              <Typography variant="body2" color="text.secondary" sx={{fontWeight: 500}}>
                {daysRemaining > 0 
                  ? `${daysRemaining} days remaining` 
                  : daysRemaining === 0 
                    ? "Due today!" 
                    : `${Math.abs(daysRemaining)} days overdue`}
              </Typography>
            </Box>
          )}
          
          {/* Description (if any) */}
          {goal.description && (
            <Typography variant="body2" color="text.secondary" mt={1} sx={{ 
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {goal.description}
            </Typography>
          )}
        </CardContent>
        
        <CardActions sx={{ justifyContent: 'flex-end', p: 1 }}>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => onEdit(goal.id)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" onClick={() => onDelete(goal.id)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </CardActions>
      </Card>
    </motion.div>
  );
};

export default GoalCard;