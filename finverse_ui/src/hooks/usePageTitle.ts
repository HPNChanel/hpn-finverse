import { useEffect } from 'react';

/**
 * Hook to update the document title when a component mounts
 */
export const usePageTitle = (title: string) => {
  useEffect(() => {
    // Save the original title
    const originalTitle = document.title;
    
    // Update the title
    document.title = `${title} | FinVerse`;
    
    // Restore the original title when the component unmounts
    return () => {
      document.title = originalTitle;
    };
  }, [title]);
};
