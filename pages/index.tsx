import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { SpeechConfig, AudioConfig, SpeechRecognizer, SpeechSynthesizer, ResultReason } from 'microsoft-cognitiveservices-speech-sdk';
import React from 'react';
import Layout from '@/components/layout';
import BottomNavigationBar from '@/components/BootomNavigationBar';
import styles from '@/styles/Home.module.css';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import LoadingDots from '@/components/ui/LoadingDots';
import SoundWave from '@/components/ui/SoundWave';
import roleSettings from 'config/role_settings.json';
import values from 'config/values.json';
import quiz_values from 'config/quiz_values.json';


export default function Home() {

  const [userInput, setUserInput] = useState<string>('');
  const [useTTS, setUseTTS] = useState(false);
  const [autoSubmit, setAutoSubmit] = useState(false);
  const [role_setting, setRoleSetting] = useState<string>("");
  const [history, setHistory] = useState<Array<{ role: string; message: string }>>([]);
  const [quizhistory, setQuizHistory] = useState<Array<{ role: string; message: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prevMessagesLength, setPrevMessagesLength] = useState<number>(0);
  // Add a state to manage the active tab.
  const [activeTab, setActiveTab] = useState('messages');
  const [messages, setMessages] = useState([
    {
      "message": "Hi there! My name is Kairos?",
      "type": "apiMessage"
    }
  ]);

  const [testMessages, setTestMessages] = useState<Array<{message: string; type: string}>>([]);
  const [conceptMessages, setConceptMessages] = useState<Array<{message: string; type: string}>>([]);
  const [travelMessages, setTravelMessages] = useState<Array<{message: string; type: string}>>([]);
  const [dndMessages, setDndMessages] = useState<Array<{message: string; type: string}>>([]);
  const [quizMessages, setQuizMessages] = useState<Array<{message: string; type: string}>>([]);
  const [nextQuiz, setNextQuiz] = useState(false);

  const replacePlaceholders = (template: string, values: { [key: string]: string }): string => {
    return template.replace(/\${(.*?)}/g, (match, key) => values[key] || "");
  };

  const [selectedItem, setSelectedItem] = useState('test');
  const handleSelect = (item: string) => {
    setSelectedItem(item);
  };

  // Create a function to handle the tab change.
  const handleTabChange = (tabName:string) => {
    setActiveTab(tabName);
  };

  useEffect(() => {
    if (selectedItem === 'test') {
      setRoleSetting(roleSettings.test);
      if (testMessages.length > 1) {
        setMessages(testMessages);
      } else {
        setMessages([ { "message": "Hi there! My name is Kairos?", "type": "apiMessage" }]);
      }
    } else if (selectedItem === 'concept') {
      const replacedTemplate = replacePlaceholders(roleSettings.concept, values);
      setRoleSetting(replacedTemplate);
    } else if (selectedItem === 'travel') {
      setRoleSetting(roleSettings.travel);
      if (travelMessages.length > 1) {
        setMessages(travelMessages);
      } else {
        setMessages([ { "message": "Hi there! My name is Kairos?", "type": "apiMessage" }]);
      }
    } else if (selectedItem === 'dnd') {
      setRoleSetting(roleSettings.dnd);
      if (dndMessages.length > 1) {
        setMessages(dndMessages);
      } else {
        setMessages([ { "message": "Hi there! My name is Kairos?", "type": "apiMessage" }]);
      }
    }
  }, [selectedItem]);

  // handle first submit when role_setting is updated
  useEffect(() => {
    if (role_setting && selectedItem ==='concept') {
      console.log('Updated role_setting:', role_setting);
  
      // Your dependent process goes here.
      if (conceptMessages.length > 2) {
        setMessages(conceptMessages);
      } else {
        setMessages([
          { "message": `Hi, Today Concept is ${values.daily_topics}`, "type": "apiMessage" },
        ]);
        handleFirstSubmit({ preventDefault: () => { } });
      }
    }
  }, [role_setting]);
  


  // store messages in state
  useEffect(() => {
    if (selectedItem === 'test') {
      setTestMessages(messages);
    } else if (selectedItem === 'concept') {
      setConceptMessages(messages);
    } else if (selectedItem === 'travel') {
      setTravelMessages(messages);
    } else if (selectedItem === 'dnd') {
      setDndMessages(messages);
    }
  }, [messages]);

  const messageListRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef(null);

  // Auto scroll chat to bottom
  useEffect(() => {
    const messageList = messageListRef.current;
    if (messageList) {
      messageList.scrollTop = messageList.scrollHeight;
    }
  }, [messages]);

  // Handle errors
  const handleError = () => {
    setMessages((prevMessages) => [...prevMessages, { "message": "Oops! There seems to be an error. Please try again.", "type": "apiMessage" }]);
    setLoading(false);
    setUserInput("");
  }

  // Handle submission
  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (userInput.trim() === "") {
      return;
    }

    setLoading(true);
    if (activeTab === 'messages') {
      setMessages((prevMessages) => [...prevMessages, { message: userInput, type: "userMessage" }]);
    } else if (activeTab === 'quizMessages') {
      setQuizMessages((prevMessages) => [...prevMessages, { message: userInput, type: "userMessage" }]);
    }

    console.log('quiz message userInput ++++', role_setting);

    let use_histoy: { role: string; message: string; }[] = [];
    
    if (activeTab === 'messages') {
        use_histoy = history;
    } else if (activeTab === 'quizMessages') {
        use_histoy = quizhistory;
    }

    // Send user question and history to API
    const response = await fetch('/api/chat1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question: userInput, history: use_histoy, role_setting: role_setting }),
    });

    if (!response.ok) {
      console.log('response not ok');
      handleError();
      return;
    }
    

    // Reset user input
    setUserInput("");
    const data = await response.json();

    console.log('data', data);

    if (data.error === "Unauthorized") {
      console.log("Unauthorized");
      handleError();
      return;
    }
    if (activeTab === 'messages') {
      setMessages((prevMessages) => [...prevMessages, { message: data.answer, type: "apiMessage" }]);
    } else if (activeTab === 'quizMessages') {
      setQuizMessages((prevMessages) => [...prevMessages, { message: data.answer, type: "apiMessage" }]);
    }
    setLoading(false);
    setNextQuiz(true);
  };

  // Handle first submission
  const handleFirstSubmit = async (e: any) => {
    e.preventDefault();

    setLoading(true);
    setMessages((prevMessages) => [...prevMessages, 
       { message: "Interesting, please give me a introduction", type: "userMessage" }]);
    // Send user question and history to API
    console.log('message', messages);
    console.log('history', history);
    console.log('role_setting', role_setting);
    const response = await fetch('/api/chat1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        question: "Interesting, please give me a introduction", 
        history: [], 
        role_setting: role_setting }),
    });

    if (!response.ok) {
      console.log('response not ok');
      handleError();
      return;
    }
    

    // Reset user input
    setUserInput("");
    const data = await response.json();

    console.log('data', data);

    if (data.error === "Unauthorized") {
      console.log("Unauthorized");
      handleError();
      return;
    }

    setMessages((prevMessages) => [...prevMessages, { message: data.answer, type: "apiMessage" }]);
    setLoading(false);
  };

  // Prevent blank submissions and allow for multiline input
  const handleEnter = (e: any) => {
    if (e.key === "Enter" && userInput) {
      if (!e.shiftKey && userInput) {
        handleSubmit(e);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  // Keep history in sync with messages
  useEffect(() => {
    const latestMessages = messages.slice(-10).map((msg) => ({
      role: msg.type === "userMessage" ? "user" : "assistant",
      message: msg.message,
    }));
    setHistory(latestMessages);
  }, [messages]);
  useEffect(() => {
    const latestMessages = quizMessages.slice(-10).map((msg) => ({
      role: msg.type === "userMessage" ? "user" : "assistant",
      message: msg.message,
    }));
    setQuizHistory(latestMessages);
  }, [quizMessages]);


  // Your existing states and functions...
  const [isRecording, setIsRecording] = useState(false);
  const [recognizer, setRecognizer] = useState<SpeechRecognizer | null>(null);
  const [recognitionResult, setRecognitionResult] = useState<string | null>(null);

  const speechConfig = SpeechConfig.fromSubscription(
    'baa4627d38424fc88dd211f05094ab37', // Replace with your Speech service key
    'eastus' // Replace with your Speech service region
  );

  const startRecording = () => {
    setIsRecording(true);
    console.log("start");

    const audioConfig = AudioConfig.fromDefaultMicrophoneInput();
    const recognizerInstance = new SpeechRecognizer(speechConfig, audioConfig);


    recognizerInstance.recognizing = (sender, event) => {
      const newText = event.result.text;
      
      setUserInput(newText);
      setRecognitionResult(newText);
      
    };


    recognizerInstance.startContinuousRecognitionAsync(
      () => { },
      (error: any) => {
        console.error('Error during speech recognition:', error);
        setIsRecording(false);
        recognizerInstance.close();
      }
    );

    setRecognizer(recognizerInstance);
  };

  const stopRecording = () => {
    if (!recognizer) return;

    recognizer.stopContinuousRecognitionAsync(
      () => {
        setIsRecording(false);
        recognizer.close();
        setRecognizer(null);
        setAutoSubmit(true);
      },
      (error) => {
        console.error("Error during stopping speech recognition:", error);
        setIsRecording(false);
        recognizer.close();
        setRecognizer(null);
      }
    );
  };

  useEffect(() => {
    if (userInput && !isRecording && autoSubmit) {
      handleSubmit({ preventDefault: () => { } });
      setAutoSubmit(false);
      setUserInput("");
    }
  }, [userInput, isRecording, autoSubmit]);


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
    const latestMessage = messages[messages.length - 1];
  
    if (
      latestMessage &&
      latestMessage.type === 'apiMessage' &&
      useTTS &&
      messages.length > prevMessagesLength
    ) {
      synthesizeTextToSpeech(latestMessage.message)
        .then((result) => {
          console.log('Text-to-speech synthesis succeeded:', result);
        })
        .catch((error) => {
          console.error('Text-to-speech synthesis failed:', error);
        });
    }
    setPrevMessagesLength(messages.length);
  }, [messages.length, useTTS]);

    // Effect to listen for new apiMessage and trigger the text-to-speech
    useEffect(() => {
      const latestMessage = quizMessages[messages.length - 1];
    
      if (
        latestMessage &&
        latestMessage.type === 'apiMessage' &&
        useTTS &&
        messages.length > prevMessagesLength
      ) {
        synthesizeTextToSpeech(latestMessage.message)
          .then((result) => {
            console.log('Text-to-speech synthesis succeeded:', result);
          })
          .catch((error) => {
            console.error('Text-to-speech synthesis failed:', error);
          });
      }
      setPrevMessagesLength(messages.length);
    }, [quizMessages.length, useTTS]);

  // enable/disable TTS
  const toggleTTS = () => {
    setUseTTS(!useTTS);
  };

  // get test result
  const getTestResult = async (e: any) => {
    e.preventDefault();
    let formattedMessages = testMessages.reduce((acc, message, index) => {
      const sender = message.type === 'apiMessage' ? 'Kairos' : 'User';
      const text = `${sender}: ${message.message}${index < testMessages.length - 1 ? '\n' : ''}`;
      return acc + text;
    }, '');

    formattedMessages = "'''\n" + formattedMessages + "\n'''";

    const replacedTemplate = replacePlaceholders(roleSettings.get_level, {"chat_history": formattedMessages});
    
    console.log('replacedTemplate', replacedTemplate);

    setLoading(true);
    // Send user question and history to API
    const response = await fetch('/api/chat_single', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question: "", role_setting: replacedTemplate }),
    });

    if (!response.ok) {
      console.log('response not ok');
      handleError();
      return;
    }

    // Reset user input
    setUserInput("");
    const data = await response.json();

    console.log('data', data);

    if (data.error === "Unauthorized") {
      console.log("Unauthorized");
      handleError();
      return;
    }

    setMessages((prevMessages) => [...prevMessages, { message: data.answer, type: "apiMessage" }]);
    setLoading(false);
  };

  
  
  // startQuiz
  const getRandomValue = (list: string | any[]) => list[Math.floor(Math.random() * list.length)];

  const startQuiz = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    handleTabChange('quizMessages');

    let formattedMessages = conceptMessages.reduce((acc, message, index) => {
      const sender = message.type === 'apiMessage' ? 'Kairos' : 'User';
      const text = `${sender}: ${message.message}${index < testMessages.length - 1 ? '\n' : ''}`;
      return acc + text;
    }, '');

    formattedMessages = "'''\n" + formattedMessages + "\n'''";

    const userEnglishLevel = values.userEnglishLevel;
    const grammarPointsForUser = quiz_values.grammar_point[userEnglishLevel];

    const grammarPointsList = Object.values(grammarPointsForUser);

    const replacedTemplate = replacePlaceholders(roleSettings.quiz, 
      {"chat_history": formattedMessages, 
      "reading_skill": getRandomValue(quiz_values.reading_skill),
      "grammer_point": getRandomValue(grammarPointsList),
      "question_type": getRandomValue(quiz_values.question_type),
      "user_english_level": values.userEnglishLevel,});
    
    console.log('replacedTemplate', replacedTemplate);

    setRoleSetting(replacedTemplate);

    const response = await fetch('/api/chat_single', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question: "", role_setting: replacedTemplate}),
    });

    if (!response.ok) {
      console.log('response not ok');
      handleError();
      return;
    }

    // Reset user input
    setUserInput("");
    const data = await response.json();

    console.log('data', data);

    if (data.error === "Unauthorized") {
      console.log("Unauthorized");
      handleError();
      return;
    }

    setQuizMessages((prevMessages) => [...prevMessages, { message: data.answer, type: "apiMessage" }]);
    setLoading(false);
  };

  const startNextQuiz = async (e: any) => {
    setNextQuiz(false);
    setQuizHistory([]);
    setQuizMessages([]);
    startQuiz(e);
  };


  return (
    <>
      <Layout>
        <div>
          <main className={styles.main}>
            <div className={styles.tabs}>
                <button className={styles.button_tab} onClick={() => handleTabChange('messages')}>Messages</button>
                <button className={styles.button_tab} onClick={() => handleTabChange('quizMessages')}>Quiz Messages</button>
            </div>
            <div className={styles.chat_setting}>
              <div className={`${styles.cloud} ${styles.chatContainer}`}>
                {activeTab === 'messages' ? (
                  <div ref={messageListRef} className={styles.messagelist}>
                  {messages.map((message, index) => {
                    return (
                      // The latest message sent by the user will be animated while waiting for a response
                      <div key={index} className={message.type === "userMessage" && loading && index === messages.length - 1 ? styles.usermessagewaiting : message.type === "apiMessage" ? styles.apimessage : styles.usermessage}>
                        {/* Display the correct icon depending on the message type */}
                        {message.type === "apiMessage" ? <Image src="/bot-image.png" alt="AI" width="30" height="30" className={styles.boticon} priority={true} /> : <Image src="/usericon.png" alt="Me" width="30" height="30" className={styles.usericon} priority={true} />}
                        <div className={styles.markdownanswer}>
                          {/* Messages are being rendered in Markdown format */}
                          <ReactMarkdown linkTarget={"_blank"}>{message.message}</ReactMarkdown>
                        </div>
                      </div>
                    )
                  })}
                  </div>
                ) : (
                  <div ref={messageListRef} className={styles.messagelist}>
                  {quizMessages.map((message, index) => {
                    return (
                      // The latest message sent by the user will be animated while waiting for a response
                      <div key={index} className={message.type === "userMessage" && loading && index === messages.length - 1 ? styles.usermessagewaiting : message.type === "apiMessage" ? styles.apimessage : styles.usermessage}>
                        {/* Display the correct icon depending on the message type */}
                        {message.type === "apiMessage" ? <Image src="/bot-image.png" alt="AI" width="30" height="30" className={styles.boticon} priority={true} /> : <Image src="/usericon.png" alt="Me" width="30" height="30" className={styles.usericon} priority={true} />}
                        <div className={styles.markdownanswer}>
                          {/* Messages are being rendered in Markdown format */}
                          <ReactMarkdown linkTarget={"_blank"}>{message.message}</ReactMarkdown>
                        </div>
                      </div>
                    )
                  })}
                  </div>
                )}
  
                {history.length > 3 && selectedItem === "test" && (
                  <button type="button" onClick={getTestResult} className={`${styles.button} ${styles.test_result_button}`}>
                    Check LEVEL
                  </button>
                )}
                {activeTab ==="messages" && conceptMessages.length > 3 && selectedItem === "concept" && (
                  <div>
                    <button type="button" onClick={startQuiz} className={`${styles.button} ${styles.test_result_button}`}>
                    Start Quiz
                  </button>
                  <button type="button" className={`${styles.button} ${styles.create_concept_button}`}>
                    Create Note
                  </button>
                  </div>
                )}
  
                {activeTab ==="quizMessages" && nextQuiz && selectedItem === "concept" && (
                  
                  <div>
                  <button type="button" onClick={startNextQuiz} className={`${styles.button} ${styles.create_concept_button}`}>
                    Next Quiz
                  </button>
                  </div>
                )}

              </div>
              <div className={styles.chat_setting_container}>
                <button type="button" onClick={toggleTTS} className={`${styles.button} ${styles.button_chat_setting}`}>
                    {useTTS ? (
                      <div>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-volume-up" viewBox="0 0 16 16">
                          <path d="M11.536 14.01A8.473 8.473 0 0 0 14.026 8a8.473 8.473 0 0 0-2.49-6.01l-.708.707A7.476 7.476 0 0 1 13.025 8c0 2.071-.84 3.946-2.197 5.303l.708.707z"/>
                          <path d="M10.121 12.596A6.48 6.48 0 0 0 12.025 8a6.48 6.48 0 0 0-1.904-4.596l-.707.707A5.483 5.483 0 0 1 11.025 8a5.483 5.483 0 0 1-1.61 3.89l.706.706z"/>
                          <path d="M10.025 8a4.486 4.486 0 0 1-1.318 3.182L8 10.475A3.489 3.489 0 0 0 9.025 8c0-.966-.392-1.841-1.025-2.475l.707-.707A4.486 4.486 0 0 1 10.025 8zM7 4a.5.5 0 0 0-.812-.39L3.825 5.5H1.5A.5.5 0 0 0 1 6v4a.5.5 0 0 0 .5.5h2.325l2.363 1.89A.5.5 0 0 0 7 12V4zM4.312 6.39 6 5.04v5.92L4.312 9.61A.5.5 0 0 0 4 9.5H2v-3h2a.5.5 0 0 0 .312-.11z"/>
                        </svg>
                      </div>
                    ) : (
                      <div>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-volume-mute" viewBox="0 0 16 16">
                          <path d="M6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06zM6 5.04 4.312 6.39A.5.5 0 0 1 4 6.5H2v3h2a.5.5 0 0 1 .312.11L6 10.96V5.04zm7.854.606a.5.5 0 0 1 0 .708L12.207 8l1.647 1.646a.5.5 0 0 1-.708.708L11.5 8.707l-1.646 1.647a.5.5 0 0 1-.708-.708L10.793 8 9.146 6.354a.5.5 0 1 1 .708-.708L11.5 7.293l1.646-1.647a.5.5 0 0 1 .708 0z"/>
                        </svg>
                      </div>
                    )}
                </button>
              </div>
            </div>
            <div className={styles.center}>
              <div className={`${styles.cloudform} ${styles.submit_area}`}>
                <div className={styles.button_container}>
                  <button
                    type="button"
                    disabled={loading || isRecording}
                    className={styles.button_speech_recog}
                    onPointerDown={startRecording}
                    onPointerUp={stopRecording}
                  >
                    {isRecording ? (
                      <SoundWave color="#000" />
                    ) : (
                      <div>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5z" />
                          <path d="M10 8a2 2 0 1 1-4 0V3a2 2 0 1 1 4 0v5zM8 0a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V3a3 3 0 0 0-3-3z" />
                        </svg>
                        <span></span>
                      </div>
                    )}
                  </button>
                </div>
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
                        : 'Enter...'
                    }
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
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
        <BottomNavigationBar onSelect={handleSelect} />
        <footer className="m-auto p-4">
        </footer>
      </Layout>
    </>
  );
}
