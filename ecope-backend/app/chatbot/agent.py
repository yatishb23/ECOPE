from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.agents import create_tool_calling_agent, AgentExecutor
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from typing import Dict, Any, Optional
import uuid

from app.core.config import settings
from app.chatbot.tools import get_chatbot_tools


class ChatbotAgent:
    def __init__(self):
        if not settings.GOOGLE_API_KEY:
            raise ValueError("Google API key not set.")

        # ✅ Gemini Model
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=settings.GOOGLE_API_KEY,
            temperature=0.7
        )

        # ✅ System Prompt
        self.system_prompt = """
You are SCOPE Assistant, an AI helper for the Student Complaint Optimisation and Prioritization Engine.

Be professional, helpful, and concise.
Use markdown tables when needed.
Highlight urgent matters clearly.
"""

        # ✅ Tools
        self.tools = get_chatbot_tools()

        # Session storage
        self.sessions = {}

    def _create_agent_for_session(self):
        # ✅ Updated prompt format (modern LangChain)
        prompt = ChatPromptTemplate.from_messages(
            [
                ("system", self.system_prompt),
                MessagesPlaceholder("chat_history"),
                ("human", "{input}"),
                MessagesPlaceholder("agent_scratchpad"),
            ]
        )

        # ✅ NEW: tool calling agent
        agent = create_tool_calling_agent(
            llm=self.llm,
            tools=self.tools,
            prompt=prompt,
        )

        agent_executor = AgentExecutor(
            agent=agent,
            tools=self.tools,
            verbose=True,
            handle_parsing_errors=True,
        )

        return agent_executor

    async def process_message(
        self,
        message: str,
        session_id: Optional[str] = None
    ) -> Dict[str, Any]:

        if not session_id:
            session_id = str(uuid.uuid4())

        if session_id not in self.sessions:
            self.sessions[session_id] = {
                "agent": self._create_agent_for_session(),
                "history": []
            }

        session = self.sessions[session_id]
        agent_executor = session["agent"]
        chat_history = session["history"]

        if not message.strip():
            return {
                "response": "Please provide a message.",
                "session_id": session_id,
                "has_tool_calls": False
            }

        try:
            result = await agent_executor.ainvoke(
                {
                    "input": message,
                    "chat_history": chat_history,
                }
            )

            response_text = result.get("output", "").strip()

            if not response_text:
                response_text = "I don't have a specific response for that."

            # Update history
            chat_history.extend([
                HumanMessage(content=message),
                AIMessage(content=response_text)
            ])

            return {
                "response": response_text,
                "session_id": session_id,
                "has_tool_calls": bool(result.get("tool_calls"))
            }

        except Exception as e:
            print("Chatbot error:", str(e))

            return {
                "response": "An error occurred while processing your request.",
                "session_id": session_id,
                "has_tool_calls": False
            }


chatbot_agent = None


def get_chatbot_agent():
    global chatbot_agent
    if chatbot_agent is None:
        chatbot_agent = ChatbotAgent()
    return chatbot_agent
