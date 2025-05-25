import Groq from "groq-sdk";
import { config } from "../config/env";

const groq = config.groq.apiKey ? new Groq({ 
  apiKey: config.groq.apiKey,
  dangerouslyAllowBrowser: true 
}) : null;

const SYSTEM_PROMPT_INITIAL = `You are a helpful and intelligent shopping assistant for a student marketplace. You have access to the current inventory of items.

Your goal is to:
1. Understand what the user is looking for through conversation
2. Suggest the best available items from the inventory, even if they're not exact matches
3. Provide helpful alternatives and similar items
4. When making suggestions, ALWAYS include specific item IDs or exact titles from the available inventory

Available categories: "Textbooks", "Electronics", "Furniture", "Clothing", "Sports Equipment", "Musical Instruments", "Other"
Available conditions: "new", "like-new", "good", "fair", "poor"  
Available pricing types: "fixed", "bidding", "negotiable"

When the user asks for something:
1. First ask clarifying questions to understand their needs better if needed
2. Then suggest specific items from the available inventory using their exact IDs or titles
3. If no exact matches exist, suggest similar or alternative items from the inventory
4. Always be helpful and provide options

Return JSON responses with one of these formats:

For conversation/questions:
{
  "response": "Your conversational response or question",
  "type": "conversation"
}

For suggestions with filters:
{
  "response": "Your suggestion message with item recommendations",
  "type": "suggestion",
  "filters": {
    "category": "optional category",
    "min_price": "optional min price",
    "max_price": "optional max price", 
    "condition": "optional condition",
    "pricing_type": "optional pricing type",
    "searchQuery": "optional search terms"
  },
  "suggested_items": ["exact item IDs or titles from the inventory that match the user's request"]
}

IMPORTANT: When providing suggested_items, use ONLY the exact item IDs or exact titles from the current inventory. Do not make up item names.`;

export const getChatbotResponse = async (userMessage, conversationHistory = [], availableListings = []) => {
  try {
    // Check if GROQ API is available
    if (!groq) {
      return {
        response: "Sorry, the AI chatbot is currently unavailable. Please check if the GROQ API key is configured.",
        type: "conversation"
      };
    }

    // Create a summary of available listings for the AI
    const listingsSummary = availableListings.map(listing => ({
      id: listing.id,
      title: listing.title,
      category: listing.category,
      price: listing.price,
      condition: listing.condition,
      pricingType: listing.pricingType,
      description: listing.description?.substring(0, 100) + "..."
    }));

    const systemPromptWithInventory = `${SYSTEM_PROMPT_INITIAL}

Current available inventory (${availableListings.length} items):
${JSON.stringify(listingsSummary, null, 2)}

Use this inventory to make specific suggestions and recommendations.`;

    const messages = [
      { role: "system", content: systemPromptWithInventory },
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
      return { 
        response: response,
        type: "conversation"
      };
    }
  } catch (error) {
    console.error('Error getting chatbot response:', error);
    throw new Error('Failed to get chatbot response');
  }
};

export const extractFiltersFromResponse = (botResponse) => {
  const filters = {};
  
  // Handle new format with filters object
  if (botResponse.filters) {
    const responseFilters = botResponse.filters;
    
    if (responseFilters.searchQuery) {
      filters.searchQuery = responseFilters.searchQuery;
    }
    
    if (responseFilters.category) {
      filters.category = responseFilters.category;
    }
    
    if (responseFilters.min_price !== undefined) {
      filters.minPrice = responseFilters.min_price.toString();
    }
    
    if (responseFilters.max_price !== undefined) {
      filters.maxPrice = responseFilters.max_price.toString();
    }
    
    if (responseFilters.condition) {
      filters.condition = responseFilters.condition;
    }
    
    if (responseFilters.pricing_type) {
      filters.pricingType = responseFilters.pricing_type;
    }
    
    return filters;
  }
  
  // Fallback to old format for backward compatibility
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