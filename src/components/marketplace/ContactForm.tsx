"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";

export function ContactForm({ supportEmail }: { supportEmail: string }) {
  const [fields, setFields] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function update(key: keyof typeof fields, value: string) {
    setFields((current) => ({ ...current, [key]: value }));
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    startTransition(async () => {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const payload = (await response.json()) as
        | { ok: true }
        | { ok: false; error: { message: string } };
      if (payload.ok) {
        setFields({ name: "", email: "", subject: "", message: "" });
        setStatus({ tone: "success", text: "Thank you — your message has been sent." });
      } else {
        setStatus({ tone: "error", text: payload.error.message });
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4 border border-line bg-white p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="form-label">Name</label>
          <Input
            id="contact-name"
            value={fields.name}
            onChange={(event) => update("name", event.target.value)}
            autoComplete="name"
            required
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="form-label">Email</label>
          <Input
            id="contact-email"
            type="email"
            value={fields.email}
            onChange={(event) => update("email", event.target.value)}
            autoComplete="email"
            required
          />
        </div>
      </div>
      <div>
        <label htmlFor="contact-subject" className="form-label">Subject</label>
        <Input
          id="contact-subject"
          value={fields.subject}
          onChange={(event) => update("subject", event.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="contact-message" className="form-label">Message</label>
        <Textarea
          id="contact-message"
          value={fields.message}
          onChange={(event) => update("message", event.target.value)}
          minLength={10}
          maxLength={2000}
          required
        />
      </div>
      {status ? (
        <p className={status.tone === "success" ? "text-sm text-success" : "form-error"}>
          {status.text}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted">
          We reply during business hours. Or email{" "}
          <a href={`mailto:${supportEmail}`} className="underline underline-offset-4">
            {supportEmail}
          </a>
          .
        </p>
        <Button type="submit" disabled={pending}>
          {pending ? "Sending…" : "Send message"}
        </Button>
      </div>
    </form>
  );
}
