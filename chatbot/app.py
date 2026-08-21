import streamlit as st
import uuid
from bot import get_agent_reply

st.set_page_config(
    page_title="Tariff Plan Chatbot",
    page_icon="📱",
    layout="centered"
)

st.title("📱 AI Tariff Plan Advisor")
st.caption("Tell me your usage needs and I'll recommend the best plans.")

# Create a unique session ID for this browser session (keeps conversation memory)
if "session_id" not in st.session_state:
    st.session_state.session_id = str(uuid.uuid4())

# Store chat history in Streamlit session state
if "messages" not in st.session_state:
    st.session_state.messages = []

# Display previous messages
for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])

# Chat input
if prompt := st.chat_input("Type your message here..."):
    # Show user message
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    # Get bot reply
    with st.chat_message("assistant"):
        with st.spinner("Thinking..."):
            try:
                result = get_agent_reply(st.session_state.session_id, prompt)
                reply = result["reply"]
                st.markdown(reply)
                st.session_state.messages.append({"role": "assistant", "content": reply})
            except Exception as e:
                error_msg = f"Error: {str(e)}"
                st.error(error_msg)
                st.session_state.messages.append({"role": "assistant", "content": error_msg})