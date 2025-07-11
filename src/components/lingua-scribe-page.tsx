"use client";

import { useState } from "react";
import { Wand2, TextQuote, Tags, Loader2, Copy, Download } from "lucide-react";

import { improveTranscription } from "@/ai/flows/improve-transcription";
import { generateSummary } from "@/ai/flows/generate-summary";
import { generateKeywords } from "@/ai/flows/generate-keywords";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

type AiAction = 'improve' | 'summarize' | 'keywords';

export function LinguaScribePage() {
    const [inputText, setInputText] = useState("");
    const [outputText, setOutputText] = useState<string | string[] | null>(null);
    const [outputTitle, setOutputTitle] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleAction = async (action: AiAction) => {
        if (!inputText.trim()) {
            toast({
                title: "Input required",
                description: "Please enter some text to process.",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);
        setOutputText(null);
        setOutputTitle("");

        try {
            let result;
            if (action === 'improve') {
                setOutputTitle("Improved Transcription");
                result = await improveTranscription({ transcription: inputText });
                setOutputText(result.improvedTranscription);
            } else if (action === 'summarize') {
                setOutputTitle("Summary");
                result = await generateSummary({ transcription: inputText });
                setOutputText(result.summary);
            } else if (action === 'keywords') {
                setOutputTitle("Keywords");
                result = await generateKeywords({ transcription: inputText });
                setOutputText(result.keywords);
            }
        } catch (error) {
            console.error("AI action failed:", error);
            toast({
                title: "An error occurred",
                description: "Failed to process the text. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        if (!outputText) return;
        const textToCopy = Array.isArray(outputText) ? outputText.join(', ') : outputText;
        navigator.clipboard.writeText(textToCopy);
        toast({
            title: "Copied to clipboard!",
        });
    };

    const handleDownload = () => {
        if (!outputText) return;
        const textToDownload = Array.isArray(outputText) ? outputText.join('\n') : outputText;
        const blob = new Blob([textToDownload], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${outputTitle.toLowerCase().replace(/\s+/g, '_')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const renderOutput = () => {
        if (Array.isArray(outputText)) {
            return (
                <div className="flex flex-wrap gap-2">
                    {outputText.map((keyword, index) => (
                        <Badge key={index} variant="secondary" className="text-sm font-normal">{keyword}</Badge>
                    ))}
                </div>
            );
        }
        return (
            <Textarea
                readOnly
                value={outputText || ""}
                className="h-64 min-h-64 bg-secondary/50"
                aria-label="Output text"
            />
        );
    };

    return (
        <div className="container mx-auto max-w-4xl py-12 px-4 min-h-screen flex flex-col">
            <header className="text-center mb-12">
                <h1 className="text-5xl font-bold font-headline text-primary">LinguaScribe</h1>
                <p className="text-muted-foreground mt-2 text-lg">Paste your text below to improve, summarize, or extract keywords with AI.</p>
            </header>

            <main className="space-y-8 flex-grow">
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="font-headline">Your Text</CardTitle>
                        <CardDescription>Paste the text you want to process.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            placeholder="Start typing or paste your transcription here..."
                            className="h-64 min-h-64"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            disabled={isLoading}
                            aria-label="Input text for processing"
                        />
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                        <Button onClick={() => handleAction('improve')} disabled={isLoading || !inputText} className="bg-accent text-accent-foreground hover:bg-accent/90">
                            <Wand2 className="mr-2 h-4 w-4" /> Improve Text
                        </Button>
                        <Button onClick={() => handleAction('summarize')} disabled={isLoading || !inputText} className="bg-accent text-accent-foreground hover:bg-accent/90">
                            <TextQuote className="mr-2 h-4 w-4" /> Summarize
                        </Button>
                        <Button onClick={() => handleAction('keywords')} disabled={isLoading || !inputText} className="bg-accent text-accent-foreground hover:bg-accent/90">
                            <Tags className="mr-2 h-4 w-4" /> Get Keywords
                        </Button>
                    </CardFooter>
                </Card>

                {isLoading && (
                    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-primary/50 p-12 text-center transition-all duration-300">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <p className="text-muted-foreground font-semibold text-lg">AI is thinking...</p>
                        <p className="text-muted-foreground">This may take a few moments.</p>
                    </div>
                )}
                
                {!isLoading && outputText && (
                    <Card className="shadow-lg animate-in fade-in-50 duration-500">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="font-headline">{outputTitle}</CardTitle>
                                <CardDescription>Here is the result from the AI.</CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="icon" onClick={handleCopy} aria-label="Copy to clipboard">
                                    <Copy className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="icon" onClick={handleDownload} aria-label="Download text">
                                    <Download className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {renderOutput()}
                        </CardContent>
                    </Card>
                )}
            </main>
        </div>
    );
}
