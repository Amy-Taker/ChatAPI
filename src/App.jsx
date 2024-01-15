import { useState, useEffect }  from 'react';
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css';
import OpenAI from 'openai';
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  TypingIndicator,
  Avatar,
  ConversationHeader,
} from '@chatscope/chat-ui-kit-react';

const App = () => {
  const firstMessege = [
    {
      message: "こんにちは，ChatGPTです！何でも聞いてください．",
      sentTime: "just now",
      sender: "ChatGPT",
    },
  ];
  const [messages, setMessages] = useState(firstMessege);
  const [isTyping, setIsTyping] = useState(false);

  const openai = new OpenAI({apiKey: import.meta.env.VITE_API_KEY, dangerouslyAllowBrowser: true});

  const [thread, setThread] = useState(false);
  useEffect(() => {
    const fetch = async () => {
      const response = await openai.beta.threads.create({});
      setThread(response);
    };
    fetch();
  }, []);

  const handleSendRequest = async (message) => {
    const newMessage = {
      message,
      direction: 'outgoing',
      sender: "user",
    };

    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setIsTyping(true);

    try {
      const response = await processMessageToChatGPT(message);
      // const response = await processMessageToChatGPT([...messages, newMessage]);
      
      const content = response;
      // .choices[0]?.message?.content;
      if (content) {
        const chatGPTResponse = {
          message: content,
          sender: "ChatGPT",
        };
        setMessages((prevMessages) => [...prevMessages, chatGPTResponse]);
      }
    } catch (error) {
      console.error("Error processing message:", error);
    } finally {
      setIsTyping(false);
    }
  };

  async function processMessageToChatGPT(chatMessages) {
    // const apiMessages = chatMessages.map((messageObject) => {
    //   const role = messageObject.sender === "ChatGPT" ? "assistant" : "user";
    //   return { role, content: messageObject.message };
    // });
    console.log(openai)
    console.log(thread)
    console.log(chatMessages)
    const message = await openai.beta.threads.messages.create(
      thread.id,
      {
        role: 'user',
        content: chatMessages,
      }
    );
    console.log(message);
    console.log(import.meta.env.VITE_ASST_ID);
    const run = await openai.beta.threads.runs.create(
      thread.id,
      {
        assistant_id: import.meta.env.VITE_ASST_ID,
      }
    );
    console.log(run);

    while (true) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const currentRun = await openai.beta.threads.runs.retrieve(
        thread.id,
        run.id
      )
      console.log(currentRun);
      if (currentRun.status === 'completed') {
        break;
      } else if (currentRun.status === 'failed' || currentRun.status === 'cancelled' || currentRun.status === 'expired') {
        throw new Error(currentRun.status);
      }
    }
    
    const messages = await openai.beta.threads.messages.list(thread.id);
    for (const message of messages.data) {
      if (message.role === 'user') break;
      const [content] = message.content;
      switch (content.type) {
        case 'text':
          console.log(content.text.value);
          break;
        case 'image_file':
          console.log('image_file', content.image_file.file_id);
      }
    }

    return content.text.value;
  }

  const footer = (sender) => {
    if (sender == "ChatGPT") {
      return "ChatGPT"
    } else {
      return "user"
    }
  }

  return (
    <div className="App">
      <div style={{ position:"relative", height: "300px", width: "500px"}}>
        <MainContainer>
          <ChatContainer>
            <ConversationHeader>
              <Avatar src={reactLogo} name="ChatGPT" />
              <ConversationHeader.Content userName="ChatGPT" info="available now"/>
            </ConversationHeader>
            <MessageList
              scrollBehavior="smooth" 
              typingIndicator={isTyping ? <TypingIndicator content="ChatGPT is typing" /> : null}
            >
              {messages.map((message, i) => {
                // console.log(message)
                return <Message key={i} model={message}>
                  <Message.Footer sender={footer(message.sender)} sentTime="just now"/>
                  </Message>
              })}
            </MessageList>
            <MessageInput placeholder="Send a Message" sendButton={true} attachButton={false} onSend={handleSendRequest} />        
          </ChatContainer>
        </MainContainer>
      </div>
    </div>
  )
}

export default App;
