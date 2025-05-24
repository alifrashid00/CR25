import Groq from "groq-sdk";

const groq = new Groq({ 
  apiKey: "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",
  dangerouslyAllowBrowser: true 
});

const SYSTEM_PROMPT = `You are a helpful and intelligent shopping assistant. Return ONLY valid JSON.

Instructions
Return only JSON with keys:

name (string)
category (string)
min_price (number)
max_price (number)  
condition (string; one of: "New", "Like New", "Fair", "Good", "Poor")
pricing_type (string; one of: "Fixed Price", "Open to Bids", "Negotiable")

Context
You must:

Understand and extract key information such as item name, category, price range, features, and brand preferences from natural language.

Clarify ambiguous requests politely when needed.

Respond in a friendly, conversational tone.

Ask relevant follow-up questions to better understand the user's needs.

Input
Provide answers to these questions in JSON format from the conversation.

Available categories: "Textbooks", "Electronics", "Furniture", "Clothing", "Sports Equipment", "Musical Instruments", "Other"
Available conditions: "new", "like-new", "good", "fair", "poor"  
Available pricing types: "fixed", "bidding", "negotiable"

If the user's message doesn't contain enough information to extract filters, return a JSON with a "response" key containing a follow-up question to gather more details.`;

export const getChatbotResponse = async (userMessage, conversationHistory = []) => {
  try {
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...conversationHistory,
      { role: "user", content: userMessage }
    ];

    const chatCompletion = await groq.chat.completions.create({
      messages,
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1000,
    });

    const response = chatCompletion.choices[0]?.message?.content || "";
      try {
      return JSON.parse(response);
    } catch {
      // If response is not valid JSON, treat it as a conversational response
      return { response: response };
    }
  } catch (error) {
    console.error('Error getting chatbot response:', error);
    throw new Error('Failed to get chatbot response');
  }
};

export const extractFiltersFromResponse = (botResponse) => {
  const filters = {};
  
  if (botResponse.name) {
    filters.searchQuery = botResponse.name;
  }
  
  if (botResponse.category) {
    filters.category = botResponse.category;
  }
  
  if (botResponse.min_price !== undefined) {
    filters.minPrice = botResponse.min_price.toString();
  }
  
  if (botResponse.max_price !== undefined) {
    filters.maxPrice = botResponse.max_price.toString();
  }
  
  if (botResponse.condition) {
    // Map the response condition to our filter values
    const conditionMap = {
      "New": "new",
      "Like New": "like-new", 
      "Good": "good",
      "Fair": "fair",
      "Poor": "poor"
    };
    filters.condition = conditionMap[botResponse.condition] || botResponse.condition.toLowerCase().replace(' ', '-');
  }
  
  if (botResponse.pricing_type) {
    // Map the response pricing type to our filter values
    const pricingMap = {
      "Fixed Price": "fixed",
      "Open to Bids": "bidding",
      "Negotiable": "negotiable"
    };
    filters.pricingType = pricingMap[botResponse.pricing_type] || botResponse.pricing_type.toLowerCase();
  }
  
  return filters;
};