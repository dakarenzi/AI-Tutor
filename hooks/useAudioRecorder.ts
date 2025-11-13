
import { useState, useRef, useCallback } from 'react';

export type RecordingStatus = 'idle' | 'recording' | 'stopped';

export const useAudioRecorder = () => {
    const [status, setStatus] = useState<RecordingStatus>('idle');
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const startRecording = useCallback(async () => {
        if (status === 'recording') return;
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setStatus('recording');
            setAudioBlob(null);
            audioChunksRef.current = [];
            
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            recorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                setStatus('stopped');
                stream.getTracks().forEach(track => track.stop());
            };

            recorder.start();
        } catch (error) {
            console.error("Error starting audio recording:", error);
            setStatus('idle');
        }
    }, [status]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && status === 'recording') {
            mediaRecorderRef.current.stop();
        }
    }, [status]);

    const reset = useCallback(() => {
        setStatus('idle');
        setAudioBlob(null);
        mediaRecorderRef.current = null;
        audioChunksRef.current = [];
    }, []);

    return { status, audioBlob, startRecording, stopRecording, reset };
};
