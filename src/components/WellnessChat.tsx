import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { Bot, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { requestWellnessChatReply } from "@/lib/chatApi";
import {
  createId,
  emitWellnessUpdate,
  getAnalysisForUser,
  getEntriesForUser,
  getChatMessages,
  saveChatMessages,
} from "@/lib/storage";
import { ChatMessage, SessionUser } from "@/types/app";
import { toast } from "sonner";

const WellnessChat = ({ user }: { user: SessionUser }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => getChatMessages(user.id));
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const hasMessages = messages.length > 0;

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }
    container.scrollTop = container.scrollHeight;
  }, [messages, isLoading]);

  const persistMessages = (next: ChatMessage[]) => {
    setMessages(next);
    saveChatMessages(user.id, next);
    emitWellnessUpdate();
  };

  const clearChat = () => {
    persistMessages([]);
    toast.success("Conversation cleared.");
  };

  const onComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!isLoading && message.trim()) {
        event.currentTarget.form?.requestSubmit();
      }
    }
  };

  const submitMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!message.trim() || isLoading) {
      return;
    }

    const userMessage: ChatMessage = {
      id: createId("chat"),
      role: "user",
      content: message.trim(),
      createdAt: new Date().toISOString(),
    };

    const nextMessages = [...messages, userMessage];
    persistMessages(nextMessages);
    setMessage("");
    setIsLoading(true);

    try {
      const analysis = getAnalysisForUser(user.id);
      const entries = getEntriesForUser(user.id);

      const reply = await requestWellnessChatReply(
        userMessage.content,
        analysis,
        entries,
        nextMessages.map((item) => ({ role: item.role, content: item.content })),
      );

      const assistantMessage: ChatMessage = {
        id: createId("chat"),
        role: "assistant",
        content: reply,
        createdAt: new Date().toISOString(),
      };

      persistMessages([...nextMessages, assistantMessage]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown AI error";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <h2 className="font-display font-semibold text-foreground">LifePulse Copilot Chat</h2>
          </div>
          <span className="text-xs text-muted-foreground">AI model connected</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">This coach uses the server-configured AI model.</p>
      </div>

      <div
        ref={scrollContainerRef}
        className="bg-card border border-border rounded-xl p-4 h-[420px] overflow-y-auto space-y-3"
      >
        {!hasMessages && (
          <div className="text-sm text-muted-foreground">
            Ask for help like: "I had a stressful day, what should I do tonight?"
          </div>
        )}

        {messages.map((item) => (
          <div
            key={item.id}
            className={`max-w-[86%] rounded-xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
              item.role === "user"
                ? "ml-auto bg-primary text-primary-foreground"
                : "bg-muted text-foreground"
            }`}
          >
            {item.content}
          </div>
        ))}

        {isLoading && (
          <div className="bg-muted text-foreground inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Thinking...
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={clearChat} disabled={!hasMessages || isLoading}>
          Clear chat
        </Button>
      </div>

      <form onSubmit={submitMessage} className="flex items-end gap-3">
        <Textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={onComposerKeyDown}
          placeholder="Chat with LifePulse Copilot"
          className="min-h-[52px] max-h-28"
        />
        <Button type="submit" disabled={isLoading || !message.trim()}>
          <Send className="h-4 w-4 mr-1" />
          Send
        </Button>
      </form>
    </div>
  );
};

export default WellnessChat;
