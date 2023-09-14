import { FileVideo, Upload } from "lucide-react";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Label } from "./ui/label";
import { useMemo, useRef, useState } from "react";
import { getFFmpeg } from "@/lib/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

export function VideoInputForm() {

    const [videoFile, setVideoFile] = useState<File | null>(null);
    const propmtInputRef = useRef<HTMLTextAreaElement>(null);

    function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];

        if (!file) return;

        setVideoFile(file);
    }

    async function convertVideoToAudio(video: File) {

        const ffmpeg = await getFFmpeg();

        await ffmpeg.writeFile('input.mp4', await fetchFile(video));

        ffmpeg.on('progress', (progress) => {
            console.log('convert progress' + Math.round(progress.progress * 100) + '%')
        })

        await ffmpeg.exec([
            '-i', 'input.mp4', '-map', '0:a', '-b:a', '20k', '-acodec', 'libmp3lame', 'output.mp3'
        ])

        const data = await ffmpeg?.readFile('output.mp3');

        const audioFileBlob = new Blob([data], { type: 'audio/mp3' });
        const audioFile = new File([audioFileBlob], 'output.mp3', { type: 'audio/mpeg' });

        console.log("Converted audio file: ", audioFile);

        return audioFile;
    }

    async function handleUploadVideo(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const prompt = propmtInputRef.current?.value;

        if (!videoFile) return;

        // converter o video em audio
        const audioFile = await convertVideoToAudio(videoFile);

        console.log("audioFile: ", audioFile);

    }

    const previewURL = useMemo(() => {
        if (!videoFile) {
            return undefined;
        }

        return URL.createObjectURL(videoFile);
    }, [videoFile])

    return (
        <form onSubmit={handleUploadVideo} className="space-y-6">
            <label
                htmlFor="video"
                className="relative border flex rounded-md aspect-video cursor-pointer border-dashed text-sm flex-col gap-2 items-center justify-center text-muted-foreground hover:bg-primary/5"
            >
                {
                    videoFile ?
                        (
                            <video src={previewURL} className="pointer-events-none absolute inset-0" />
                        )
                        :
                        (
                            <><FileVideo className="w-4 h-4" />Selecione um vídeo</>
                        )
                }

            </label>

            <input onChange={handleFileSelect} type="file" id="video" accept="video/mp4" className="sr-only" />

            <Separator />

            <div className="space-y-2">
                <Label htmlFor="trnascription_prompt">Prompt de transcrição</Label>
                <Textarea
                    id="trnascription_prompt"
                    className="resize-none h-20 leading-relaxed"
                    placeholder="Inclua palavras-chave mencionadas no vídeo separados por vírgula"
                    ref={propmtInputRef}
                />
            </div>

            <Button className="w-full" type="submit">
                Carregar vídeo
                <Upload className="w-4 h-4 ml-2" />
            </Button>
        </form>
    )
}