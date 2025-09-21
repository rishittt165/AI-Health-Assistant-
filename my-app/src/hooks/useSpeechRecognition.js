import { useState, useCallback } from 'react';

const useSpeechRecognition = ({ onResult, onEnd }) => {
  const [recognition, setRecognition] = useState(null);

  const startListening = useCallback(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        onResult(transcript);
      };

      recognition.onend = onEnd;
      recognition.start();
      setRecognition(recognition);
    } else {
      alert("Speech recognition not supported in this browser. Try Chrome or Edge.");
    }
  }, [onResult, onEnd]);

  const stopListening = useCallback(() => {
    if (recognition) {
      recognition.stop();
    }
  }, [recognition]);

  return { startListening, stopListening };
};

export default useSpeechRecognition;