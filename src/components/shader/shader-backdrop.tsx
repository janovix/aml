"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const ShaderField = dynamic(() => import("./shader-field"), {
	ssr: false,
	loading: () => <ShaderFallback />,
});

function ShaderFallback() {
	return <div className="auth-shader-fallback absolute inset-0" />;
}

function webglAvailable(): boolean {
	try {
		const canvas = document.createElement("canvas");
		return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
	} catch {
		return false;
	}
}

export function ShaderBackdrop({
	position = "fixed",
}: {
	/** `fixed` covers the viewport. `absolute` fills a positioned parent, such as the mobile menu. */
	position?: "fixed" | "absolute";
}) {
	const [shader, setShader] = useState(false);

	useEffect(() => {
		const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
		const sync = () => setShader(!motion.matches && webglAvailable());
		sync();
		motion.addEventListener("change", sync);
		return () => motion.removeEventListener("change", sync);
	}, []);

	return (
		<div
			className={
				position === "fixed"
					? "pointer-events-none fixed inset-0 -z-10"
					: "pointer-events-none absolute inset-0"
			}
			aria-hidden="true"
		>
			{shader ? <ShaderField /> : <ShaderFallback />}
		</div>
	);
}
