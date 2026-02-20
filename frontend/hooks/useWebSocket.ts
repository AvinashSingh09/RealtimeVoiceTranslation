import { useState, useRef, useCallback, useEffect } from 'react';

interface UseWebSocketProps {
    url: string;
    onMessage: (message: MessageEvent) => void;
    onOpen?: () => void;
    onClose?: () => void;
}

export const useWebSocket = ({ url, onMessage, onOpen, onClose }: UseWebSocketProps) => {
    const ws = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    // Store latest callbacks in refs to avoid stale closures
    const urlRef = useRef(url);
    const onMessageRef = useRef(onMessage);
    const onOpenRef = useRef(onOpen);
    const onCloseRef = useRef(onClose);

    useEffect(() => { urlRef.current = url; }, [url]);
    useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);
    useEffect(() => { onOpenRef.current = onOpen; }, [onOpen]);
    useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

    const connect = useCallback(() => {
        if (ws.current && (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING)) {
            return;
        }

        const socket = new WebSocket(urlRef.current);
        ws.current = socket;

        socket.onopen = () => {
            console.log('WebSocket Connected');
            setIsConnected(true);
            onOpenRef.current?.();
        };

        socket.onmessage = (event) => {
            onMessageRef.current(event);
        };

        socket.onclose = () => {
            console.log('WebSocket Disconnected');
            setIsConnected(false);
            if (ws.current === socket) ws.current = null;
            onCloseRef.current?.();
        };

        socket.onerror = (error) => {
            console.error('WebSocket Error:', error);
        };
    }, []); // No dependencies — uses refs for latest values

    const disconnect = useCallback(() => {
        if (ws.current) {
            ws.current.close();
            ws.current = null;
        }
    }, []);

    const sendMessage = useCallback((data: string | ArrayBuffer | Blob) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(data);
        } else {
            console.warn('WebSocket not connected');
        }
    }, []);

    return { connect, disconnect, sendMessage, isConnected };
};
