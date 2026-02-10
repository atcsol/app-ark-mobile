import React, { useState, useCallback } from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

interface Props {
  uri: string;
  fallbackUri?: string;
  style?: StyleProp<ImageStyle>;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
}

export function FallbackImage({ uri, fallbackUri, style, resizeMode = 'cover' }: Props) {
  const [source, setSource] = useState(uri);
  const [didFallback, setDidFallback] = useState(false);

  const handleError = useCallback(() => {
    if (!didFallback && fallbackUri && source !== fallbackUri) {
      setSource(fallbackUri);
      setDidFallback(true);
    }
  }, [didFallback, fallbackUri, source]);

  return (
    <Image
      source={{ uri: source }}
      style={style}
      resizeMode={resizeMode}
      onError={handleError}
    />
  );
}
