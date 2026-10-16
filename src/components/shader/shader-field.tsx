"use client";

import { Component, useEffect, useState, type ReactNode } from "react";
import { ShaderGradient, ShaderGradientCanvas } from "@shadergradient/react";

/** Yenio primary. Dark uses a deeper blue so the field stays in the same hue. */
const LIGHT_PRIMARY = "#2567d4";
const DARK_PRIMARY = "#163e7a";

function ShaderFallback() {
	return <div className="auth-shader-fallback absolute inset-0" />;
}

function useDarkTheme(): boolean {
	const [dark, setDark] = useState(() =>
		document.documentElement.classList.contains("dark"),
	);

	useEffect(() => {
		const root = document.documentElement;
		const read = () => setDark(root.classList.contains("dark"));
		const observer = new MutationObserver(read);
		observer.observe(root, { attributes: true, attributeFilter: ["class"] });
		return () => observer.disconnect();
	}, []);

	return dark;
}

class ShaderErrorBoundary extends Component<
	{ children: ReactNode; fallback: ReactNode },
	{ failed: boolean }
> {
	state = { failed: false };

	static getDerivedStateFromError(): { failed: boolean } {
		return { failed: true };
	}

	render() {
		return this.state.failed ? this.props.fallback : this.props.children;
	}
}

export default function ShaderField() {
	const dark = useDarkTheme();
	const primary = dark ? DARK_PRIMARY : LIGHT_PRIMARY;

	return (
		<ShaderErrorBoundary fallback={<ShaderFallback />}>
			<ShaderGradientCanvas
				className="absolute inset-0"
				style={{
					position: "absolute",
					inset: 0,
					width: "100%",
					height: "100%",
				}}
				pointerEvents="none"
				pixelDensity={1}
				lazyLoad={false}
			>
				<ShaderGradient
					control="props"
					animate="on"
					type="waterPlane"
					shader="defaults"
					color1={primary}
					color2={dark ? "#0d274f" : "#8eb4ef"}
					color3={dark ? "#071428" : "#1a4d9e"}
					brightness={dark ? 0.7 : 1.15}
					grain="off"
					lightType="3d"
					envPreset="city"
					uSpeed={0.2}
					uStrength={2.2}
					uDensity={1.2}
					uFrequency={5.5}
					uAmplitude={1}
					cAzimuthAngle={180}
					cPolarAngle={90}
					cDistance={3.6}
					cameraZoom={1}
					positionX={0}
					positionY={0.4}
					positionZ={0}
					rotationX={40}
					rotationY={0}
					rotationZ={-40}
					reflection={0.12}
				/>
			</ShaderGradientCanvas>
		</ShaderErrorBoundary>
	);
}
