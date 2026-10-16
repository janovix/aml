const ISOTYPE_PATH =
	"M78.00,146.22C63.38,144.38 56.86,130.20 63.86,115.50C65.43,112.20 67.62,108.70 68.73,107.71C70.72,105.94 70.73,105.97 70.24,112.88C69.63,121.48 70.41,124.85 73.27,125.90C76.54,127.11 80.54,125.60 86.77,120.80C95.67,113.93 105.13,102.11 121.68,77.17C142.91,45.19 156.37,26.89 160.28,24.69C164.25,22.46 171.14,22.93 174.18,25.63C177.02,28.16 179.00,33.14 178.99,37.72C178.98,43.60 175.12,50.33 163.08,65.50C156.97,73.20 148.74,84.22 144.79,90.00C118.08,129.06 95.13,148.38 78.00,146.22Z M62.01,87.39C56.19,85.28 50.72,81.42 44.54,75.09C39.25,69.67 39.45,69.03 45.63,71.62C52.24,74.39 60.79,73.87 68.16,70.24C76.43,66.17 81.41,61.11 97.47,40.47C116.40,16.15 128.78,5.50 142.93,1.35C161.90,-4.22 180.61,7.74 182.57,26.68L183.17,32.50 L180.02,27.17C176.13,20.59 171.98,18.52 164.29,19.31C152.27,20.55 141.66,29.07 118.27,56.25C102.36,74.75 95.64,80.83 86.15,85.29C78.25,89.01 68.74,89.84 62.01,87.39Z M49.50,68.63C39.27,66.03 33.58,61.53 23.63,48.17C16.46,38.55 13.71,36.17 5.56,32.57C1.32,30.69 0.00,29.60 0.00,27.98C0.00,21.36 14.06,15.57 30.04,15.60C35.28,15.61 40.12,15.96 40.79,16.37C41.64,16.90 40.95,18.12 38.51,20.43C32.37,26.22 33.23,28.73 47.67,47.04C56.08,57.71 63.31,64.00 67.17,64.00C70.17,64.00 69.25,65.59 65.25,67.32C59.79,69.67 55.16,70.06 49.50,68.63Z M62.50,55.16C60.30,54.10 57.10,51.73 55.38,49.87C48.51,42.44 39.00,29.43 39.00,27.45C39.00,23.91 43.06,21.00 48.00,21.00C55.18,21.00 60.33,24.24 66.95,32.94C70.19,37.19 74.67,42.58 76.92,44.91C79.16,47.25 81.00,49.96 81.00,50.93C81.00,56.18 69.93,58.71 62.50,55.16Z";

function isotypeDimensions(width?: number, height?: number) {
	const w = width ?? 28;
	const h = height ?? Math.round((w * 147) / 183);
	return { w, h };
}

function Isotype({
	width,
	height,
	className,
}: {
	width?: number;
	height?: number;
	className?: string;
}) {
	const { w, h } = isotypeDimensions(width, height);
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 183 147"
			width={w}
			height={h}
			className={className}
			aria-hidden
		>
			<path fill="currentColor" d={ISOTYPE_PATH} />
		</svg>
	);
}

export function Logo({
	variant = "logo",
	className,
	imgClassName,
	width,
	height,
}: {
	variant?: "logo" | "icon";
	className?: string;
	imgClassName?: string;
	width?: number;
	height?: number;
}) {
	const { w, h } = isotypeDimensions(
		variant === "icon" ? (width ?? 32) : width,
		variant === "icon"
			? (height ?? Math.round(((width ?? 32) * 147) / 183))
			: height,
	);

	if (variant === "icon") {
		return (
			<div className={className} role="img" aria-label="Yenio">
				<Isotype
					width={w}
					height={h}
					className={`text-primary ${imgClassName ?? ""}`}
				/>
			</div>
		);
	}

	return (
		<div
			className={`flex items-center gap-2 ${className ?? ""}`}
			role="img"
			aria-label="Yenio"
		>
			<Isotype
				width={w}
				height={h}
				className={`shrink-0 text-primary ${imgClassName ?? ""}`}
			/>
			<span className="font-semibold text-foreground tracking-tight">
				Yenio
			</span>
		</div>
	);
}
