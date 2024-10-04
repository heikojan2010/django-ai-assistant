import React, { Suspense, useEffect, useState } from 'react';
import { Canvas, ReactThreeFiber, useThree, ThreeElements } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei';
import NeuralNetwork from './NeuralNetwork';

function NeuralVisual() {
    const [embeddingStream, setEmbeddingStream] = useState([]);

    useEffect(() => {
        // Use EventSource to connect to the Django SSE endpoint
        const eventSource = new EventSource('http://localhost:8000/sse/embedding/?query=your_query_here');

        eventSource.onmessage = function(event) {
            const token = event.data;
            if (token === '[DONE]') {
                // Close the connection when done
                eventSource.close();
            } else {
                setEmbeddingStream(prevStream => [...prevStream, token]);

                // Update the 3D visualization with the new token
                updateVisualizationWithEmbedding(token);
            }
        };

        eventSource.onerror = function(event) {
            console.error('Error with SSE connection:', event);
            eventSource.close();
        };

        return () => eventSource.close();  // Cleanup when the component is unmounted
    }, []);

    const updateVisualizationWithEmbedding = (embeddingToken) => {
        // Handle the embedding token to update your 3D visualization
        console.log('Received Embedding Token:', embeddingToken);
        // Example: Adjust particle positions, colors, etc., based on the embedding token
    };

    return (
        <>
        <Canvas camera={{ position: [0, 0, 20] }}>
      <Suspense>
      <color attach="background" args={["black"]} />

    <NeuralNetwork numLayers={3} />

 


        <OrbitControls />

      </Suspense>
    </Canvas>
    </>
    );
}

export default NeuralVisual;
