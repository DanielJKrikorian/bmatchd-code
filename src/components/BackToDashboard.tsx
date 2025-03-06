import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';

const BackToDashboard = () => {
  const navigate = useNavigate();

  return (
    <Button
      variant="ghost"
      onClick={() => navigate('/dashboard')}
      className="mb-6"
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      Back to Dashboard
    </Button>
  );
};

export default BackToDashboard;