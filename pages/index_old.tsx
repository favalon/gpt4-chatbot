import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { SpeechConfig, AudioConfig, SpeechRecognizer, SpeechSynthesizer } from 'microsoft-cognitiveservices-speech-sdk';
import React from 'react';
import Layout from '@/components/layout';
import BottomNavigationBar from '@/components/BootomNavigationBar';
import styles from '@/styles/Home.module.css';
import { Message } from '@/types/chat';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import LoadingDots from '@/components/ui/LoadingDots';
import { Document } from 'langchain/document';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function Home() {
  const [query, setQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [sourceDocs, setSourceDocs] = useState<Document[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [messageState, setMessageState] = useState<{
    messages: Message[];
    pending?: string;
    history: [string, string][];
    pendingSourceDocs?: Document[];
  }>({
    messages: [
      {
        message: "Let's get started! I'am Kairos, your personal CEFR level assistant.",
        type: 'apiMessage',
      },
    ],
    history: [],
    pendingSourceDocs: [],
  });

  const { messages, pending, history, pendingSourceDocs } = messageState;

  const messageListRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textAreaRef.current?.focus();
  }, []);

  // Handle errors
  const handleError = () => {
    setMessageState((state) => ({
      ...state,
      messages: [
        ...state.messages,
        {
          type: 'userMessage',
          message: query,
        },
      ],
      pending: undefined,
    }));  
    setLoading(false);
    setQuery("");
  }

  //handle form submission
  const handleSubmit = async(e: any) => {
    e.preventDefault();

    if (query.trim() === "") {
      return;
    }

    setLoading(true);
    const question = query.trim();

    setMessageState((state) => ({
      ...state,
      messages: [
        ...state.messages,
        {
          type: 'userMessage',
          message: question,
        },
      ],
      pending: undefined,
    }));

    // Send user question and history to API
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
          "Content-Type": "application/json",
      },
      body: JSON.stringify({ question: question, history: history }),
    });

    if (!response.ok) {
      handleError();
      return;
  }
  
  // async function handleSubmit(e: any) {
  //   e.preventDefault();

  //   setError(null);

  //   if (!query) {
  //     alert('Please input a question');
  //     return;
  //   }

  //   const question = query.trim();

  //   setMessageState((state) => ({
  //     ...state,
  //     messages: [
  //       ...state.messages,
  //       {
  //         type: 'userMessage',
  //         message: question,
  //       },
  //     ],
  //     pending: undefined,
  //   }));

  //   setLoading(true);
  //   setQuery('');
  //   setMessageState((state) => ({ ...state, pending: '' }));

  //   const ctrl = new AbortController();

  //   try {


  //     // fetchEventSource('/api/chat_without_local', {
  //     //   method: 'POST',
  //     //   headers: {
  //     //     'Content-Type': 'application/json',
  //     //   },
  //     //   body: JSON.stringify({
  //     //     question,
  //     //     history,
  //     //   }),
  //     //   signal: ctrl.signal,
      
  //     //   onmessage: (event) => {
  //     //     if (event.data === '[DONE]') {
  //     //       setMessageState((state) => ({
  //     //         history: [...state.history, [question, state.pending ?? '']],
  //     //         messages: [
  //     //           ...state.messages,
  //     //           {
  //     //             type: 'apiMessage',
  //     //             message: state.pending ?? '',
  //     //             sourceDocs: state.pendingSourceDocs,
  //     //           },
  //     //         ],
  //     //         pending: undefined,
  //     //         pendingSourceDocs: undefined,
  //     //       }));
  //     //       setLoading(false);
  //     //       ctrl.abort();
  //     //     } else {
  //     //       const data = JSON.parse(event.data);
  //     //       if (data.sourceDocs) {
  //     //         setMessageState((state) => ({
  //     //           ...state,
  //     //           pendingSourceDocs: data.sourceDocs,
  //     //         }));
  //     //       } else {
  //     //         setMessageState((state) => ({
  //     //           ...state,
  //     //           pending: (state.pending ?? '') + data.data,
  //     //         }));
  //     //       }
  //     //     }
  //     //   },
  //     // });
  //   } catch (error) {
  //     setLoading(false);
  //     setError('An error occurred while fetching the data. Please try again.');
  //     console.log('error', error);
  //   }
  // }

  //prevent empty submissions
  const handleEnter = useCallback(
    (e: any) => {
      if (e.key === 'Enter' && query) {
        handleSubmit(e);
      } else if (e.key == 'Enter') {
        e.preventDefault();
      }
    },
    [query],
  );

  const chatMessages = useMemo(() => {
    return [
      ...messages,
      ...(pending
        ? [
            {
              type: 'apiMessage',
              message: pending,
              sourceDocs: pendingSourceDocs,
            },
          ]
        : []),
    ];
  }, [messages, pending, pendingSourceDocs]);

  //const [value, setValue] = React.useState(0);

  //scroll to bottom of chat
  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [chatMessages]);


  const [selectedItem, setSelectedItem] = useState('home');

  const handleSelect = (item: string) => {
    setSelectedItem(item);
  };

  // Your existing states and functions...
  const [isRecording, setIsRecording] = useState(false);

  const speechConfig = SpeechConfig.fromSubscription(
    'baa4627d38424fc88dd211f05094ab37', // Replace with your Speech service key
    'eastus' // Replace with your Speech service region
  );

  const startSpeechRecognition = async () => {
    setIsRecording(true);

    const audioConfig = AudioConfig.fromDefaultMicrophoneInput();
    const recognizer = new SpeechRecognizer(speechConfig, audioConfig);

    recognizer.recognizeOnceAsync(
      (result) => {
        setQuery(result.text);
        setIsRecording(false);
        recognizer.close();
      },
      (error) => {
        console.error('Error during speech recognition:', error);
        setIsRecording(false);
        recognizer.close();
      }
    );
  };


// Function to synthesize text using Azure Text-to-Speech
const synthesizeTextToSpeech = async (text: string) => {
  return new Promise((resolve, reject) => {
    const audioConfig = AudioConfig.fromDefaultSpeakerOutput();
    const synthesizer = new SpeechSynthesizer(speechConfig, audioConfig);
    synthesizer.speakTextAsync(
      text,
      (result) => {
        if (result) {
          synthesizer.close();
          resolve(result);
        } else {
          synthesizer.close();
          reject(new Error('Synthesis failed.'));
        }
      },
      (error) => {
        synthesizer.close();
        reject(error);
      }
    );
  });
};

// Effect to listen for new apiMessage and trigger the text-to-speech
useEffect(() => {
  const latestMessage = chatMessages[messages.length - 1];

  if (latestMessage && latestMessage.type === 'apiMessage') {
    synthesizeTextToSpeech(latestMessage.message)
      .then((result) => {
        console.log('Text-to-speech synthesis succeeded:', result);
      })
      .catch((error) => {
        console.error('Text-to-speech synthesis failed:', error);
      });
  }

  //log chat messages to console with each update
  
}, [messages]);


  return (
    <>
      <Layout>
        <div className="mx-auto flex flex-col gap-4">
          <main className={styles.main}>
            <div className={styles.cloud}>
              <div ref={messageListRef} className={styles.messagelist}>
                {chatMessages.map((message, index) => {
                  let icon;
                  let className;
                  if (message.type === 'apiMessage') {
                    icon = (
                      <Image
                        src="/bot-image.png"
                        alt="AI"
                        width="40"
                        height="40"
                        className={styles.boticon}
                        priority
                      />
                    );
                    className = styles.apimessage;
                  } else {
                    icon = (
                      <Image
                        src="/usericon.png"
                        alt="Me"
                        width="30"
                        height="30"
                        className={styles.usericon}
                        priority
                      />
                    );
                    // The latest message sent by the user will be animated while waiting for a response
                    className =
                      loading && index === chatMessages.length - 1
                        ? styles.usermessagewaiting
                        : styles.usermessage;
                  }
                  return (
                    <>
                      <div key={`chatMessage-${index}`} className={className}>
                        {icon}
                        <div className={styles.markdownanswer}>
                          <ReactMarkdown linkTarget="_blank">
                            {message.message}
                          </ReactMarkdown>
                        </div>
                      </div>
                      {message.sourceDocs && (
                        <div
                          className="p-5"
                          key={`sourceDocsAccordion-${index}`}
                        >
                          <Accordion
                            type="single"
                            collapsible
                            className="flex-col"
                          >
                            {message.sourceDocs.map((doc, index) => (
                              <div key={`messageSourceDocs-${index}`}>
                                <AccordionItem value={`item-${index}`}>
                                  <AccordionTrigger>
                                    <h3>Source {index + 1}</h3>
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <ReactMarkdown linkTarget="_blank">
                                      {doc.pageContent}
                                    </ReactMarkdown>
                                    <p className="mt-2">
                                      <b>Source:</b> {doc.metadata.source}
                                    </p>
                                  </AccordionContent>
                                </AccordionItem>
                              </div>
                            ))}
                          </Accordion>
                        </div>
                      )}
                    </>
                  );
                })}
                {sourceDocs.length > 0 && (
                  <div className="p-5">
                    <Accordion type="single" collapsible className="flex-col">
                      {sourceDocs.map((doc, index) => (
                        <div key={`SourceDocs-${index}`}>
                          <AccordionItem value={`item-${index}`}>
                            <AccordionTrigger>
                              <h3>Source {index + 1}</h3>
                            </AccordionTrigger>
                            <AccordionContent>
                              <ReactMarkdown linkTarget="_blank">
                                {doc.pageContent}
                              </ReactMarkdown>
                            </AccordionContent>
                          </AccordionItem>
                        </div>
                      ))}
                    </Accordion>
                  </div>
                )}
              </div>
            </div>
            <div className={styles.center}>
              <div className={styles.cloudform}>
                <form onSubmit={handleSubmit} className={styles.submit_area}>
                  <textarea
                    disabled={loading}
                    onKeyDown={handleEnter}
                    ref={textAreaRef}
                    autoFocus={false}
                    rows={1}
                    maxLength={512}
                    id="userInput"
                    name="userInput"
                    placeholder={
                      loading
                        ? 'Waiting for response...'
                        : 'What is this legal case about?'
                    }
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className={styles.textarea}
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className={styles.button}
                  >
                    {loading ? (
                      <div className={styles.loadingwheel}>
                        <LoadingDots color="#000" />
                      </div>
                    ) : (
                      // Send icon SVG in input field
                      <svg
                        viewBox="0 0 20 20"
                        className={styles.svgicon}
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                      </svg>
                    )}
                  </button>
                  <button
                      type="submit"
                      disabled={loading || isRecording}
                      className={styles.button}
                      onClick={startSpeechRecognition}
                    >
                      {isRecording ? (
                            'Recording...'
                          ) : (
                            <div>
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5z"/>
                                <path d="M10 8a2 2 0 1 1-4 0V3a2 2 0 1 1 4 0v5zM8 0a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V3a3 3 0 0 0-3-3z"/>
                              </svg> 
                              <span></span>
                            </div>
                            )}
                    </button>
                </form>
              </div>
            </div>
            {error && (
              <div className="border border-red-400 rounded-md p-4">
                <p className="text-red-500">{error}</p>
              </div>
            )}
          </main>
        </div>
        <BottomNavigationBar  onSelect={handleSelect} />
        <footer className="m-auto p-4">
        
        </footer>
      </Layout>
    </>
  );
}