import React, { useState } from 'react';
import { Session } from '../types';
import { LoadingSpinner } from './icons';
import { CanvasSection } from './CanvasView';
import MarkdownRenderer from './MarkdownRenderer';

interface CheatSheetViewProps {
  session: Session;
  onGenerate: (modelType: 'flash' | 'pro') => void;
  isLoading: boolean;
  onBack: () => void;
}

const tipsContent = [
    {
        number: 0,
        title: "Scoping",
        subtitle: "Set the boundaries before you start.",
        content: `**Define placement and audience first:** Ask yes/no: in-app or standalone; existing users or net-new. This prevents drifting beyond the core surface.\n\n**Set non-goals and guardrails early:** Write “out of scope” items and constraints (privacy, compliance, timeline, infra). It stops scope creep later.\n\n**Choose one differentiator:** Pick the single edge (e.g., network effects, unique data) and use it to prune features that don’t reinforce it.\n\n**Timebox decisions:** Spend 2–3 minutes to fix scope, then move on. Long scoping stalls momentum.\n\n**Paraphrase and confirm:** Mirror back answers and get a verbal “yes” to avoid hidden misalignments.\n\n**Capture assumptions visibly:** List assumptions you’re making and tag them with revisit points in v2.\n\n**Write a one-line scope summary at the top:** Example: “Design an in-app MVP for everyday users, software-only, optimizing engagement under privacy constraints.”`
    },
    {
        number: 1,
        title: "Why?",
        subtitle: "Understand your goal",
        content: `**Clarify the Ambiguity:** Interview prompts are intentionally vague. Your first job is to be a detective. Ask clarifying questions to narrow the scope ("Are we targeting mobile or desktop? Is this for a new or existing product?").\n\n**Use the 5 Whys:** Dig deep to find the root problem. Don't settle for the surface-level issue. Example: "Users want to save articles." -> "Why?" -> "To read them later." -> "Why?" -> "Because they don't have time right now." -> The core problem is time management, not just saving.\n\n**Define Success Early:** What does success look like for the business (e.g., increase engagement by 10%) and the user (e.g., save time finding content)? This sets the stage for your metrics later.`
    },
    {
        number: 2,
        title: "Who?",
        subtitle: "Define the audience",
        content: `**Be Specific, Not Broad:** Avoid vague personas like "millennials." Create a primary persona with a name, goals, motivations, and frustrations. Example: "Sarah, a 32-year-old busy professional who commutes 45 minutes daily and wants to catch up on industry news efficiently."\n\n**Consider Primary vs. Secondary Users:** Who is the main target? Are there other groups who might use this? Focusing on the primary user prevents a bloated, unfocused solution.`
    },
    {
        number: 3,
        title: "When & Where?",
        subtitle: "Customer's context & needs",
        content: `**Map the User Journey:** Detail the steps the user takes before, during, and after using your potential solution. Identify pain points and opportunities at each step.\n\n**Context is King:** Where is the user physically and emotionally? On a noisy train (needs simple UI, offline access)? At their desk (can handle complexity)? Stressed (needs a calming, reassuring experience)? This context reveals crucial design constraints.`
    },
    {
        number: 4,
        title: "What?",
        subtitle: "List ideas",
        content: `**Brainstorm Broadly:** Use "How Might We..." statements to frame idea generation (e.g., "HMW make it easier for Sarah to consume news during her commute?"). Aim for quantity over quality at this stage. No idea is too wild.\n\n**Diverge then Converge:** First, generate a wide range of ideas (diverge). Then, start grouping them and weeding out the less viable ones (converge).`
    },
    {
        number: 5,
        title: "Prioritize, choose idea",
        subtitle: "Justify your choice",
        content: `**Use a Framework:** An Impact/Effort matrix is a standard, effective tool. High-impact, low-effort ideas are your "Quick Wins."\n\n**Justify Your Ratings:** Don't just place items on the matrix. Briefly explain *why* you believe an idea has high impact (e.g., "addresses the core pain point for our primary persona") and high effort (e.g., "requires new machine learning model").\n\n**State Your Choice Clearly:** Explicitly say which idea you're moving forward with and why it's the best strategic choice based on your prioritization.`
    },
    {
        number: 6,
        title: "Solve",
        subtitle: "Detail your solution",
        content: `**Create a User Flow:** Don't just describe screens. Map out the step-by-step journey a user takes to accomplish their goal with your chosen feature. Where do they start? What are the key decisions they make?\n\n**Sketch Key Screens:** Wireframe the 3-4 most critical screens in the user flow. Focus on layout, hierarchy, and key interactions. You don't need a perfect drawing; you need to communicate the idea clearly.\n\n**Consider Edge Cases:** What happens if there's no internet? What does an empty state look like for a new user? Showing you've thought about these details demonstrates senior-level thinking.`
    },
    {
        number: 7,
        title: "How?",
        subtitle: "Measure success",
        content: `**Connect Metrics to Goals:** Your success metrics should directly measure whether you solved the problem you defined in the "Why?" section. Use a framework like Google's HEART (Happiness, Engagement, Adoption, Retention, Task Success).\n\n**Be Specific and Actionable:** Avoid "vanity metrics" like "number of sign-ups." Choose actionable KPIs. Instead of "increase engagement," say "Increase the average number of articles read per user per week from 2 to 4." This is measurable and directly tied to the user value.`
    }
];


const HowToAnswerView: React.FC = () => (
    <div className="h-full overflow-y-auto pt-4">
        <div className="max-w-4xl w-full mx-auto">
            <div className="space-y-4 pb-8">
                {tipsContent.map(tip => (
                    <CanvasSection key={tip.number} number={tip.number} title={tip.title} subtitle={tip.subtitle}>
                        <div className="p-2 rounded-md bg-brand-bg/50 text-sm text-brand-text">
                            <MarkdownRenderer content={tip.content} />
                        </div>
                    </CanvasSection>
                ))}
            </div>
        </div>
    </div>
);


const GenerateAnswerView: React.FC<CheatSheetViewProps> = ({ session, onGenerate, isLoading, onBack }) => {

    const parseCheatSheetContent = (content: string): { [key: string]: string } => {
        const sections: { [key: string]: string } = {};
        const sectionTitles = [
          "Why?", "Who?", "When & Where?", "What?",
          "Prioritize, choose idea", "Solve", "How?",
        ];
        const parts = content.split(/## \d+\. /);
        if (parts.length > 1) {
          for (let i = 1; i < parts.length; i++) {
              const part = parts[i];
              const lines = part.split('\n');
              const titleLine = lines[0] || '';
              const restOfContent = lines.slice(1).join('\n').trim();
              const matchedTitle = sectionTitles.find(t => titleLine.includes(t));
              if (matchedTitle) sections[matchedTitle] = restOfContent;
          }
        }
        return sections;
    };
    
    if (isLoading && !session.cheatSheetContent) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <LoadingSpinner className="h-12 w-12 text-brand-primary mb-6" />
                <h2 className="text-2xl font-semibold mb-2 text-brand-text">Generating Your Expert Guide...</h2>
                <p className="text-brand-text-muted max-w-sm">
                    Our top AI product designer is crafting a comprehensive solution. This might take a moment.
                </p>
            </div>
        );
    }

    if (session.cheatSheetContent) {
        const parsedSections = parseCheatSheetContent(session.cheatSheetContent);
        const sectionDefinitions = [
            { title: "Why?", subtitle: "Understand your goal" },
            { title: "Who?", subtitle: "Define the audience" },
            { title: "When & Where?", subtitle: "Customer's context & needs" },
            { title: "What?", subtitle: "List ideas" },
            { title: "Prioritize, choose idea", subtitle: "Justify your choice" },
            { title: "Solve", subtitle: "Detail your solution" },
            { title: "How?", subtitle: "Measure success" },
        ];

        return (
            <div className="h-full overflow-y-auto pt-4">
                <div className="max-w-4xl w-full mx-auto">
                    <div className="p-4 bg-brand-surface border border-brand-secondary rounded-lg mb-4">
                        <h2 className="text-sm font-semibold text-brand-text-muted mb-1">EXPERT SOLUTION FOR:</h2>
                        <p className="text-brand-text">{session.canvasState?.task}</p>
                    </div>
                    <div className="space-y-4 pb-8">
                        {sectionDefinitions.map((sec, index) => (
                            <CanvasSection key={sec.title} number={index + 1} title={sec.title} subtitle={sec.subtitle}>
                                <div className="p-2 rounded-md bg-brand-bg/50 text-sm text-brand-text">
                                    <MarkdownRenderer content={parsedSections[sec.title] || "No content generated for this section."} />
                                </div>
                            </CanvasSection>
                        ))}
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
          <div className="max-w-xl">
            <h2 className="text-2xl font-semibold mb-2 text-brand-text">Generate an Expert Solution?</h2>
            <p className="text-brand-text-muted mb-8">
              Get a comprehensive, high-quality answer for the current design challenge generated by AI. This is a great learning tool, but we recommend trying to solve it yourself first.
            </p>
    
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <button
                    onClick={() => onGenerate('flash')}
                    className="p-4 text-left bg-brand-surface rounded-lg border border-brand-secondary hover:border-brand-primary hover:bg-brand-secondary/30 transition-all"
                >
                    <h3 className="font-semibold text-brand-text">Gemini Flash</h3>
                    <p className="text-sm text-brand-text-muted mt-1">Faster generation, great for quick ideas.</p>
                </button>
                <button
                    onClick={() => onGenerate('pro')}
                    className="p-4 text-left bg-brand-surface rounded-lg border border-brand-secondary hover:border-brand-primary hover:bg-brand-secondary/30 transition-all"
                >
                    <h3 className="font-semibold text-brand-text">Gemini 2.5 Pro</h3>
                    <p className="text-sm text-brand-text-muted mt-1">Highest quality analysis for complex problems.</p>
                </button>
            </div>
    
            <button
                onClick={onBack}
                className="px-6 py-2 font-semibold text-brand-text bg-brand-secondary rounded-lg hover:bg-zinc-600"
            >
                Go Back
            </button>
          </div>
        </div>
      );
};


const CheatSheetView: React.FC<CheatSheetViewProps> = (props) => {
    const [activeTab, setActiveTab] = useState<'howTo' | 'generate'>('howTo');

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-center space-x-8 border-b border-brand-secondary">
                <button
                    onClick={() => setActiveTab('howTo')}
                    className={`py-3 text-lg font-semibold transition-colors ${activeTab === 'howTo' ? 'text-brand-text border-b-2 border-brand-primary' : 'text-brand-text-muted hover:text-brand-text'}`}
                >
                    How To Answer
                </button>
                <button
                    onClick={() => setActiveTab('generate')}
                    className={`py-3 text-lg font-semibold transition-colors ${activeTab === 'generate' ? 'text-brand-text border-b-2 border-brand-primary' : 'text-brand-text-muted hover:text-brand-text'}`}
                >
                    Generate Answer
                </button>
            </div>
            <div className="flex-1 min-h-0">
                {activeTab === 'howTo' ? <HowToAnswerView /> : <GenerateAnswerView {...props} />}
            </div>
        </div>
    );
};

export default CheatSheetView;