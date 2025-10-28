import React, { useEffect, useRef, useState } from 'react';
import { getVideoSources, checkVideoExists } from '@/utils/videoPreloader';

interface ReliableVideoProps {
  src: string;
  onEnded?: () => void;
  onError?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

const ReliableVideo: React.FC<ReliableVideoProps> = ({
  src,
  onEnded,
  onError,
  className,
  style
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState('');

  useEffect(() => {
    const tryVideoSources = async () => {
      const sources = getVideoSources();
      
      for (const source of sources) {
        try {
          const exists = await checkVideoExists(source);
          if (exists) {
            setCurrentSrc(source);
            return;
          }
        } catch {
          continue;
        }
      }
      
      // If no sources work, use fallback
      setHasError(true);
      onError?.();
    };

    tryVideoSources();
  }, [src, onError]);

  useEffect(() => {
    if (!currentSrc) return;
    
    const video = videoRef.current;
    if (!video) return;

    const handleCanPlay = () => {
      setIsLoaded(true);
      video.play().catch(() => {
        setHasError(true);
        onError?.();
      });
    };

    const handleError = () => {
      setHasError(true);
      onError?.();
    };

    const handleEnded = () => {
      onEnded?.();
    };

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);
    video.addEventListener('ended', handleEnded);

    // Set source and load
    video.src = currentSrc;
    video.load();

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
      video.removeEventListener('ended', handleEnded);
    };
  }, [currentSrc, onEnded, onError]);

  if (hasError || !currentSrc) {
    return null;
  }

  return (
    <video
      ref={videoRef}
      muted
      playsInline
      preload="auto"
      controls={false}
      disablePictureInPicture
      controlsList="nodownload nofullscreen noremoteplayback"
      className={className}
      style={{
        ...style,
        outline: 'none',
        border: 'none'
      }}
    />
  );
};

export default ReliableVideo;