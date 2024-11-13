import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import Editor from "./editor/markdown-editor";

export interface MessageCardProps {
    title?: string;
    content: string;
    position: "left" | "right";
    aiActionTaken?: boolean;
}

export default function MessageCard({ title, content, position, aiActionTaken }: MessageCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`relative flex ${position === 'right' ? 'justify-end' : 'justify-start'}`}
        >
            <Card className={`w-full max-w-md overflow-hidden ${position === 'right' ? 'bg-blue-500 text-white' : 'bg-white text-gray-800'}`}>
                {aiActionTaken && (
                    <div className="animate-pulse bg-gradient-to-r from-blue-400 via-teal-500 to-purple-500 h-1"></div>
                )}
                <CardContent className="p-6">
                    {title && (
                        <h3 className="text-lg font-semibold mb-2">{title}</h3>
                    )}
                    <Editor
                        readOnly
                        markdown={content}
                        contentEditableClassName="!p-0"
                        className={position === 'right' ? 'dark-theme text-white' : ''}
                    />
                </CardContent>
            </Card>
        </motion.div>
    );
}
