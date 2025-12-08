"use client";

import { useState } from "react";
import { useSendMessage } from "@/hooks/use-chat";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export function ChatInput({ conversationId }: { conversationId: string }) {
  const [value, setValue] = useState("");
  const sendMessage = useSendMessage();

  const send = () => {
    if (!value.trim()) return;
    if (sendMessage.isPending) return;

    sendMessage.mutate(
      { conversationId, content: value.trim() },
      {
        onSuccess: () => {
          setValue("");
        },
        onError: (error) => {
          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to send message. Please try again."
          );
        },
      }
    );
  };

  return (
    <div className="p-4 border-t flex flex-col gap-2">
      {sendMessage.isError && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="w-4 h-4" />
          <span>
            {sendMessage.error instanceof Error
              ? sendMessage.error.message
              : "Failed to send message"}
          </span>
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Type your message…"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          disabled={sendMessage.isPending}
          maxLength={10000}
        />
        <Button
          onClick={send}
          disabled={sendMessage.isPending || !value.trim()}
        >
          {sendMessage.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            "Send"
          )}
        </Button>
      </div>
      {value.length > 9000 && (
        <p className="text-xs text-muted-foreground">
          {value.length}/10000 characters
        </p>
      )}
    </div>
  );
}
