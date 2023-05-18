"use client";

import React from "react";
import { useFormik } from "formik";
const { Configuration, OpenAIApi } = require("openai");

const MAX_TOKENS = 4096;
const TOKENS_PER_MESSAGE = 50;
interface Message {
  sender: "user" | "EcommerceBot";
  text: string;
}

interface HubtelInfoItem {
  prompt: string;
  response: string;
}

const hubtelContextArray: HubtelInfoItem[] = [
  {
    prompt: "What is the Hubtel support phone number?",
    response: "The Hubtel support phone number is 030 700 0576.",
  },
  {
    prompt:
      "Can I add location or an extra item after my order has already been placed?",
    response:
      "Unfortunately, you can't add a location or an extra item after an order has been placed. You'll need to cancel the order and place a new one, or call our support line at 030 700 0576 for further assistance.",
  },
  {
    prompt: "What happens if my delivery is delayed?",
    response:
      "Our sincere apologies for the delay. The rider is currently picking up your order and will be on their way shortly. The rider will call you when they arrive at your location.",
  },
  {
    prompt: "I received the wrong order, what should I do?",
    response:
      "Our apologies for the inconvenience caused by the wrong order. We're investigating the issue and will get back to you as soon as possible.",
  },
  {
    prompt:
      "I ordered 60 cedis of pork but only received 7 pieces. What should I do?",
    response:
      "We're sorry for the discrepancy in your order. We're currently investigating the issue and will revert back to you shortly.",
  },
];

const prompt = `
Translate the following English text to commands:
"Add bananas to my cart." -> "add:bananas"
"I want apples." -> "add:apples"
"Can you add a pineapple to the cart?" -> "add:pineapple"
"I want to buy a laptop." -> "add:laptop"
"Please put sugar in my cart." -> "add:sugar"
`;

const capitalizeFirstLetter = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export default function Home() {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const lastMessageRef = React.useRef<HTMLDivElement | null>(null);

  // Custom sampleSize function.
  function sampleSize(array: HubtelInfoItem[], size: number): HubtelInfoItem[] {
    const shuffledArray = array.slice().sort(() => 0.5 - Math.random());
    return shuffledArray.slice(0, size);
  }

  // Combine a number of random elements from the array to form the context string.
  const sampleSizeValue = 5; // Adjust this to control the number of elements used.
  const contextElements = sampleSize(hubtelContextArray, sampleSizeValue);
  const contextString = contextElements
    .map((item) => `${item.prompt}\n${item.response}`)
    .join("\n\n");

  const configuration = new Configuration({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);

  const formik = useFormik({
    initialValues: {
      userInput: "",
    },
    onSubmit: async (values) => {
      formik.resetForm();
      if (
        !values.userInput.trim() ||
        values.userInput.split(" ").length > 500
      ) {
        return;
      }
      const userInput = values.userInput;

      // Append user message to the chat history
      setMessages([...messages, { sender: "user", text: userInput }]);
      setIsLoading(true);

      const maxMessages = Math.floor(MAX_TOKENS / TOKENS_PER_MESSAGE);

      const conversation = [
        {
          role: "system",
          content: `You are an AI bot called Ecommerce Bot that specializes in hubtel.com and Hubtel customer care. Answer the question based on the context added. If the question can't be answered based on the context, try to provide a relevant answer using your general knowledge about hubtel. Do not ask for order details or details about thing you have no access to. Keep your answers as relevant as possible. If you still can't provide a relevant answer, say "I don't have an answer for that at the moment."`,
        },
        {
          role: "system",
          content: `If question asked is not relevant to hubtel, say "I don't have an answer for that at the moment."`,
        },
        {
          role: "system",
          content: `Sometimes, a user will make a request or issue a command. If the command is in the is similar to -in natural language terms-: ${prompt}, respond with "{item} has been added to your cart.". Otherwise, just generate an answer based on the context.`,
        },
        {
          role: "system",
          content: contextString,
        },
        ...messages
          .filter((message) => message.sender === "user")
          .slice(-maxMessages)
          .map((message) => ({
            role: "user",
            content: message.text,
          })),
        {
          role: "user",
          content: userInput,
        },
      ];

      // Replace the following code with your AI chatbot code
      try {
        const response = await openai.createChatCompletion({
          model: "gpt-3.5-turbo",
          messages: conversation,
          max_tokens: 2048,
          temperature: 0.3,
        });

        const aiResponse = response?.data?.choices?.[0]?.message?.content;
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setIsLoading(false);

        const match = aiResponse?.match(/(.*) has been added to your cart/);
        if (match) {
          const item = match[1];
          const command = `add:${item}`;
          console.log(command);
        }
        setMessages((prevMessages) => [
          ...prevMessages,
          { sender: "EcommerceBot", text: aiResponse },
        ]);
      } catch (err) {
        console.log("An error occured. Please try again later.");
      }
    },
  });

  React.useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col justify-center">
      <div className="bg-white w-full max-w-2xl mx-auto p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6">ECommerce Bot</h1>
        <div className="h-80 bg-gray-200 p-4 mb-4 rounded-lg overflow-y-auto">
          {messages.length === 0 && (
            <div className="text-center text-gray-500">
              <h2 className="font-bold text-xl mb-2">
                Start a conversation with ECommerce Bot
              </h2>
              <p className="mb-1">Example questions:</p>
              <ul className="list-disc list-inside">
                <ul>What can you tell me?</ul>
                <ul>Do you delivery in Accra?</ul>
              </ul>
            </div>
          )}
          {messages.map((message, index) => {
            const formattedText = capitalizeFirstLetter(message.text);
            const isHeading = formattedText.match(/^[a-zA-Z]+:$/);
            const isLastMessage = index === messages.length - 1;

            return (
              <div
                key={message.text}
                ref={isLastMessage ? lastMessageRef : null}
                className={`mb-2 ${
                  message.sender === "user" ? "text-right" : "text-left"
                }`}
              >
                <span className="font-semibold">
                  {message.sender === "user" ? "You: " : "EcommerceBot: "}
                </span>
                <span className={`${isHeading ? "font-bold text-lg" : ""}`}>
                  {formattedText}
                </span>
              </div>
            );
          })}
          {isLoading && (
            <div className="flex justify-center">
              <div className="animate-bounce w-2 h-2 mx-1 bg-blue-500 rounded-full" />
              <div
                className="animate-bounce w-2 h-2 mx-1 bg-blue-500 rounded-full"
                style={{ animationDelay: "0.2s" }}
              />
              <div
                className="animate-bounce w-2 h-2 mx-1 bg-blue-500 rounded-full"
                style={{ animationDelay: "0.4s" }}
              />
            </div>
          )}
        </div>
        <form onSubmit={formik.handleSubmit}>
          <div className="flex items-center">
            <input
              type="text"
              placeholder="Type your question here..."
              className="flex-grow border border-gray-300 p-2 rounded-lg mr-2"
              value={formik.values.userInput}
              onChange={formik.handleChange}
              name="userInput"
            />
            <button
              type="submit"
              className="bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
