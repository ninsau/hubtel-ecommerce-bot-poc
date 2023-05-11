"use client";

import React from "react";
import { useFormik } from "formik";

interface Message {
  sender: "user" | "EcommerceBot";
  text: string;
}

type HubtelInfo = string[];

const hubtelContextArray: HubtelInfo = [
  "hubtel support phone number: 030 700 0576",
  "add location or extra item after oder has already been placed: you can not do that. you have to cancel the order and place a new one or call 030 700 0576",
  "delayed delivery: apologies for delay. rider picking up order and on the way. rider will call when at your location.",
  "Acknowledged test request. Revert time needed.",
  "Apologies for wrong order. Investigating and will revert.",
  "Ordered 60 cedis of pork but received 7 pieces. Investigating and will revert.",
  "Order processed successfully. Rider will contact for delivery.",
  "Please cancel my order.",
  "Apologies for delay. Rider picking up order and on the way.",
  "Still waiting for delivery.",
  "Delivery delayed. Rider picking up order and on the way.",
  "Payment received. Rider picking up order from kitchen.",
  "Request noted. Thank you.",
  "Apologies for delay. Rider will call when at your location.",
  "Apologies for delay. Rider on the way to pick up order.",
  "Rider on the way to pick up your order. Will call when at your location.",
  "Order cancellation requested.",
  "Concerned if order will be delivered today.",
  "Payment received. Rider on the way to pick up order from the kitchen.",
  "Apologies for delay. Delivery started, rider will contact you.",
  "No vegetables requested.",
  "Inquiring if food will be received today.",
  "Delivery for order started. Rider will contact you shortly.",
  "Please call me on 0244225351.",
  "Additional note: Lots of pepper with the noodles.",
  "Order delivered. Contact if any concerns.",
  "Order modification not possible. Add preferences in notes for future orders.",
  "Strict delivery to chosen location only. Thank you.",
  "Order processed successfully. Rider will engage upon arrival.",
  "Order ready for pick up. Rider will call upon arrival.",
  "Order ready for delivery. Rider will call upon arrival.",
  "Vaseline Dry Skin Repair 400ml lotion available on app/Web. Place order there.",
  "Unable to process request for delivered order. Add notes for future orders.",
  "Placing order assistance available. Let us know how we can help.",
  "Rider on the way to pick up your order from the kitchen. Will call when at your location.",
];

const capitalizeFirstLetter = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export default function Home() {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const lastMessageRef = React.useRef<HTMLDivElement | null>(null);

  // Custom sampleSize function.
  function sampleSize(array: HubtelInfo, size: number): HubtelInfo {
    const shuffledArray = array.slice().sort(() => 0.5 - Math.random());
    return shuffledArray.slice(0, size);
  }

  // Combine a number of random elements from the array to form the context string.
  const sampleSizeValue = 5; // Adjust this to control the number of elements used.
  const contextElements = sampleSize(hubtelContextArray, sampleSizeValue);
  const contextString = contextElements.join("\n");

  const { Configuration, OpenAIApi } = require("openai");
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

      // Replace the following code with your AI chatbot code
      try {
        const response = await openai.createChatCompletion({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `You are an AI bot called Ecommerce Bot that specializes in hubtel.com and Hubtel customer care. Answer the question based on the context added. If the question can't be answered based on the context, try to provide a relevant answer using your general knowledge about hubtel. Do not ask for order details or details about thing you have no access to. Keep your answers as relevant as possible. If you still can't provide a relevant answer, say "I don't have an answer for that at the moment."`,
            },
            ...hubtelContextArray.map((contextString) => ({
              role: "system",
              content: contextString,
            })),
            {
              role: "user",
              content: userInput,
            },
          ],
          max_tokens: 2048,
        });

        const aiResponse = response?.data?.choices?.[0]?.message?.content;
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setIsLoading(false);

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
