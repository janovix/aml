"use client";

import { useState, useRef } from "react";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { useJwt } from "@/hooks/useJwt";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/mutations";
import { parseInvoiceXml } from "@/lib/api/invoices";
import { PageHero } from "@/components/page-hero";
import { useLanguage } from "@/components/LanguageProvider";

export function InvoiceXmlUpload(): React.ReactElement {
	const { navigateTo } = useOrgNavigation();
	const { t } = useLanguage();
	const { jwt, isLoading: isJwtLoading } = useJwt();
	const [isUploading, setIsUploading] = useState(false);
	const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFileChange = async (
		e: React.ChangeEvent<HTMLInputElement>,
	): Promise<void> => {
		const file = e.target.files?.[0];

		console.log("handleFileChange called", {
			hasFile: !!file,
			fileName: file?.name,
			fileSize: file?.size,
			fileType: file?.type,
		});

		if (!file) {
			console.log("No file selected, returning");
			return;
		}

		if (!file.name.toLowerCase().endsWith(".xml")) {
			toast.error(t("invXmlOnly"));
			return;
		}

		if (!jwt) {
			toast.error(t("invAuthTokenError"));
			return;
		}

		setSelectedFileName(file.name);
		setIsUploading(true);

		try {
			console.log("Reading file content...", {
				fileSize: file.size,
				fileName: file.name,
				fileType: file.type,
			});

			// Try file.text() first (modern API)
			let xmlContent: string;
			try {
				xmlContent = await file.text();
				console.log("File read via file.text()", {
					contentLength: xmlContent.length,
					contentPreview: xmlContent.substring(0, 100),
				});
			} catch (textError) {
				console.warn("file.text() failed, trying FileReader", textError);
				// Fallback to FileReader
				xmlContent = await new Promise<string>((resolve, reject) => {
					const reader = new FileReader();
					reader.onload = (event) => {
						const content = event.target?.result;
						console.log("FileReader onload fired", {
							hasContent: !!content,
							contentType: typeof content,
							contentLength: typeof content === "string" ? content.length : 0,
						});
						if (typeof content === "string") {
							resolve(content);
						} else {
							reject(new Error("Failed to read file as text"));
						}
					};
					reader.onerror = (error) => {
						console.error("FileReader error", error);
						reject(new Error("Error reading file"));
					};
					console.log("Starting FileReader.readAsText()");
					reader.readAsText(file);
				});
				console.log("File read via FileReader", {
					contentLength: xmlContent.length,
					contentPreview: xmlContent.substring(0, 100),
				});
			}

			// Validate that content was actually read
			console.log("Validating file content", {
				hasContent: !!xmlContent,
				contentLength: xmlContent?.length ?? 0,
				trimmedLength: xmlContent?.trim().length ?? 0,
			});

			if (!xmlContent || xmlContent.trim().length === 0) {
				throw new Error(t("invXmlEmpty"));
			}

			if (xmlContent.length < 100) {
				throw new Error(t("invXmlTooShort"));
			}

			console.log("XML file validated successfully:", {
				fileName: file.name,
				fileSize: file.size,
				contentLength: xmlContent.length,
				contentPreview: xmlContent.substring(0, 200),
			});

			const result = await parseInvoiceXml({
				input: { xmlContent },
				jwt,
			});

			toast.success(t("invXmlProcessed"));

			// Navigate to the CFDI review / create-operation flow
			navigateTo(`/invoices/${result.invoice.id}/create-operation`);
		} catch (error) {
			console.error("Error parsing invoice XML:", error);
			toast.error(extractErrorMessage(error), { id: "invoice-upload" });
			setSelectedFileName(null);
			// Reset file input
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
		} finally {
			setIsUploading(false);
		}
	};

	const handleButtonClick = (): void => {
		fileInputRef.current?.click();
	};

	return (
		<div className="space-y-6">
			<PageHero
				title={t("invUploadXml")}
				subtitle={t("invUploadXmlDesc")}
				icon={Upload}
				backButton={{
					label: t("invBackToInvoices"),
					onClick: () => navigateTo("/invoices"),
				}}
			/>

			<Card className="max-w-2xl">
				<CardHeader>
					<CardTitle>{t("invCfdiXml")}</CardTitle>
					<CardDescription>{t("invCfdiXmlDesc")}</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{/* Hidden file input */}
						<Input
							ref={fileInputRef}
							type="file"
							accept=".xml"
							onChange={handleFileChange}
							disabled={isUploading || isJwtLoading}
							className="hidden"
						/>

						{/* Upload area */}
						<div
							className="flex flex-col items-center gap-4 rounded-lg border-2 border-dashed p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
							onClick={handleButtonClick}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									handleButtonClick();
								}
							}}
							role="button"
							tabIndex={0}
						>
							{isUploading ? (
								<>
									<Loader2 className="h-10 w-10 text-primary animate-spin" />
									<div>
										<p className="text-sm font-medium">
											{t("invProcessing")} {selectedFileName}...
										</p>
										<p className="text-xs text-muted-foreground mt-1">
											{t("invAnalyzing")}
										</p>
									</div>
								</>
							) : (
								<>
									<FileText className="h-10 w-10 text-muted-foreground" />
									<div>
										<p className="text-sm font-medium">
											{selectedFileName ?? t("invClickToSelect")}
										</p>
										<p className="text-xs text-muted-foreground mt-1">
											{t("invXmlFormats")}
										</p>
									</div>
									<Button
										type="button"
										variant="outline"
										disabled={isJwtLoading}
										onClick={(e) => {
											e.stopPropagation();
											handleButtonClick();
										}}
									>
										<Upload className="h-4 w-4 mr-2" />
										{t("invSelectFile")}
									</Button>
								</>
							)}
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
