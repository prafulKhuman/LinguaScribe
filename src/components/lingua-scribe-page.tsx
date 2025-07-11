
"use client";

import { useState, useRef } from "react";
import { Wand2, TextQuote, Tags, Loader2, Copy, Download, Upload, FileAudio } from "lucide-react";

import { improveTranscription } from "@/ai/flows/improve-transcription";
import { generateSummary } from "@/ai/flows/generate-summary";
import { generateKeywords } from "@/ai/flows/generate-keywords";
import { transcribeAudio } from "@/ai/flows/transcribe-audio";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

type AiAction = 'improve' | 'summarize' | 'keywords' | 'transcribe';

export function LinguaScribePage() {
    const [inputText, setInputText] = useState("");
    const [outputText, setOutputText] = useState<string | string[] | null>(null);
    const [outputTitle, setOutputTitle] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [loadingAction, setLoadingAction] = useState<AiAction | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [progress, setProgress] = useState(0);
    const [progressStatus, setProgressStatus] = useState("");
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setProgress(0);
            setProgressStatus("");
        }
    };
    
    const handleTranscribe = async () => {
        if (!selectedFile) {
            toast({
                title: "No file selected",
                description: "Please select an audio or video file to transcribe.",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);
        setLoadingAction('transcribe');
        setOutputText(null);
        setOutputTitle("");
        setInputText("");
        setProgress(0);
        setProgressStatus("Preparing file...");

        try {
            const reader = new FileReader();
            
            reader.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percentage = Math.round((event.loaded / event.total) * 100);
                    setProgress(percentage);
                    setProgressStatus(`Reading file: ${percentage}%`);
                }
            };

            reader.readAsDataURL(selectedFile);
            reader.onload = async () => {
                try {
                    setProgress(100);
                    setProgressStatus("File read complete. Transcribing with AI...");
                    const mediaDataUri = reader.result as string;
                    const result = await transcribeAudio({ mediaDataUri });
                    setInputText(result.transcription);
                    toast({
                        title: "Transcription Complete!",
                        description: "The transcribed text is now in the text area below.",
                    });
                    setSelectedFile(null);
                     if(fileInputRef.current) {
                        fileInputRef.current.value = "";
                    }
                } catch (error) {
                    console.error("Transcription failed inside reader:", error);
                    toast({
                        title: "An error occurred",
                        description: "Failed to transcribe the file. Please try again.",
                        variant: "destructive",
                    });
                } finally {
                    setIsLoading(false);
                    setLoadingAction(null);
                    setProgress(0);
                    setProgressStatus("");
                }
            };
            reader.onerror = (error) => {
                console.error("File reading failed:", error);
                toast({
                    title: "An error occurred",
                    description: "Failed to read the selected file.",
                    variant: "destructive",
                });
                setIsLoading(false);
                setLoadingAction(null);
                setProgress(0);
                setProgressStatus("");
            };
        } catch (error) {
             console.error("Transcription failed:", error);
            toast({
                title: "An error occurred",
                description: "Failed to transcribe the file. Please try again.",
                variant: "destructive",
            });
            setIsLoading(false);
            setLoadingAction(null);
            setProgress(0);
            setProgressStatus("");
        }
    };


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
        setLoadingAction(action);
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
            setLoadingAction(null);
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
                <p className="text-muted-foreground mt-2 text-lg">Transcribe audio/video, then improve, summarize, or extract keywords with AI.</p>
            </header>

            <main className="space-y-8 flex-grow">
                 <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2"><FileAudio/> Transcribe Audio/Video</CardTitle>
                        <CardDescription>Upload an audio or video file to get a transcription.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-grow">
                                <Input
                                    ref={fileInputRef}
                                    id="file-upload"
                                    type="file"
                                    accept="audio/*,video/*"
                                    onChange={handleFileChange}
                                    disabled={isLoading}
                                    className="h-12 text-base cursor-pointer"
                                />
                                {selectedFile && <p className="text-sm text-muted-foreground mt-2">Selected: {selectedFile.name}</p>}
                            </div>
                           
                            <Button onClick={handleTranscribe} disabled={isLoading || !selectedFile} className="bg-primary text-primary-foreground hover:bg-primary/90 h-12">
                                {isLoading && loadingAction === 'transcribe' ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Upload className="mr-2 h-4 w-4" />
                                )}
                                Transcribe File
                            </Button>
                        </div>
                        {isLoading && loadingAction === 'transcribe' && (
                            <div className="space-y-2">
                                <Progress value={progress} className="w-full" />
                                <p className="text-sm text-muted-foreground">{progressStatus}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>


                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="font-headline">Your Text</CardTitle>
                        <CardDescription>The transcription will appear here. You can also paste your own text.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            placeholder="Your transcription will appear here, or you can paste your own text..."
                            className="h-64 min-h-64"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            disabled={isLoading}
                            aria-label="Input text for processing"
                        />
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2 flex-wrap">
                        <Button onClick={() => handleAction('improve')} disabled={isLoading || !inputText} className="bg-accent text-accent-foreground hover:bg-accent/90">
                            {isLoading && loadingAction === 'improve' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Wand2 className="mr-2 h-4 w-4" />} Improve Text
                        </Button>
                        <Button onClick={() => handleAction('summarize')} disabled={isLoading || !inputText} className="bg-accent text-accent-foreground hover:bg-accent/90">
                           {isLoading && loadingAction === 'summarize' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <TextQuote className="mr-2 h-4 w-4" />} Summarize
                        </Button>
                        <Button onClick={() => handleAction('keywords')} disabled={isLoading || !inputText} className="bg-accent text-accent-foreground hover:bg-accent/90">
                           {isLoading && loadingAction === 'keywords' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Tags className="mr-2 h-4 w-4" />} Get Keywords
                        </Button>
                    </CardFooter>
                </Card>

                {isLoading && loadingAction !== 'transcribe' && (
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
