import { SectionHeading } from '@/components/ui/Primitives';
import { ChatWindow } from '@/components/advisor/ChatWindow';

export default function AdvisorPage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <SectionHeading
        eyebrow="AI Advisor"
        title="Talk it through with your AI advisor"
        description="Describe how you use your phone in your own words — I'll build your profile and match you with the best plans as we chat."
        align="center"
      />
      <ChatWindow />
    </div>
  );
}
