import React, { useState, useEffect } from "react";
import * as GoogleGenerativeAI from "@google/generative-ai";
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import * as Speech from "expo-speech";
import { FontAwesome, Entypo } from "@expo/vector-icons";
import FlashMessage, { showMessage } from "react-native-flash-message";

const GeminiChat = () => {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const API_KEY = process.env.GOOGLE_API_KEY; // Set API key securely

  useEffect(() => {
    initializeChat();
  }, []);

  const initializeChat = async () => {
    const welcomeMessage = await generateMessage("hello!");
    if (welcomeMessage) {
      showMessage({
        message: "Welcome to Gemini Chat 🤖",
        description: welcomeMessage,
        type: "info",
        icon: "info",
        duration: 2000,
      });
      setMessages([{ text: welcomeMessage, user: false }]);
    }
  };

  const generateMessage = async (prompt) => {
    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel("gemini-pro");
      const result = await model.generateContent(prompt);
      return result?.response?.text || "";
    } catch (error) {
      console.error("Error generating message:", error);
      return "Sorry, something went wrong.";
    }
  };

  const sendMessage = async () => {
    if (!userInput.trim()) return;
    setLoading(true);

    const userMessage = { text: userInput, user: true };
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    const botResponse = await generateMessage(userInput);
    setMessages((prevMessages) => [
      ...prevMessages,
      { text: botResponse, user: false },
    ]);
    setLoading(false);
    setUserInput("");

    if (botResponse) handleSpeech(botResponse);
  };

  const handleSpeech = (text) => {
    if (isSpeaking) Speech.stop();
    Speech.speak(text, { onDone: () => setIsSpeaking(false) });
    setIsSpeaking(true);
  };

  const toggleSpeech = () => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
    } else if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1].text;
      handleSpeech(lastMessage);
    }
  };

  const clearMessages = () => {
    setMessages([]);
    setIsSpeaking(false);
  };

  const renderMessage = ({ item }) => (
    <View style={styles.messageContainer}>
      <Text style={[styles.messageText, item.user && styles.userMessage]}>
        {item.text}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item, index) => `${item.text}-${index}`}
        inverted
      />
      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.icon} onPress={toggleSpeech}>
          <FontAwesome
            name={isSpeaking ? "microphone-slash" : "microphone"}
            size={24}
            color="white"
          />
        </TouchableOpacity>
        <TextInput
          placeholder="Type a message"
          value={userInput}
          onChangeText={setUserInput}
          onSubmitEditing={sendMessage}
          style={styles.input}
          placeholderTextColor="#fff"
        />
        {messages.length > 0 && (
          <TouchableOpacity style={styles.icon} onPress={clearMessages}>
            <Entypo name="controller-stop" size={24} color="white" />
          </TouchableOpacity>
        )}
        {loading && <ActivityIndicator size="large" color="black" />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", marginTop: 50 },
  messageContainer: { padding: 10, marginVertical: 5 },
  messageText: { fontSize: 16 },
  userMessage: { alignSelf: "flex-end", color: "#007AFF" },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#131314",
  },
  input: {
    flex: 1,
    padding: 10,
    backgroundColor: "#2C2C2E",
    borderRadius: 10,
    height: 50,
    color: "white",
  },
  icon: {
    padding: 10,
    backgroundColor: "#2C2C2E",
    borderRadius: 25,
    height: 50,
    width: 50,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5,
  },
});

export default GeminiChat;
