import type { Component } from "solid-js";

interface ProviderBadgeProps {
	source: string;
	size?: "sm" | "md";
}

export const ProviderBadge: Component<ProviderBadgeProps> = (props) => {
	const size = () => props.size ?? "sm";

	const getBadgeConfig = () => {
		switch (props.source) {
			case "vertex":
				return {
					label: "Vertex",
					bgColor: "bg-blue-100 dark:bg-blue-900/30",
					textColor: "text-blue-700 dark:text-blue-300",
					dotColor: "bg-blue-500",
				};
			case "vertex+gemini-api":
				return {
					label: "Vertex+API",
					bgColor: "bg-purple-100 dark:bg-purple-900/30",
					textColor: "text-purple-700 dark:text-purple-300",
					dotColor: "bg-purple-500",
				};
			case "gemini-api":
				return {
					label: "API Key",
					bgColor: "bg-green-100 dark:bg-green-900/30",
					textColor: "text-green-700 dark:text-green-300",
					dotColor: "bg-green-500",
				};
			case "copilot":
				return {
					label: "Copilot",
					bgColor: "bg-orange-100 dark:bg-orange-900/30",
					textColor: "text-orange-700 dark:text-orange-300",
					dotColor: "bg-orange-500",
				};
			case "oauth":
				return {
					label: "OAuth",
					bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
					textColor: "text-indigo-700 dark:text-indigo-300",
					dotColor: "bg-indigo-500",
				};
			case "api-key":
				return {
					label: "API Key",
					bgColor: "bg-green-100 dark:bg-green-900/30",
					textColor: "text-green-700 dark:text-green-300",
					dotColor: "bg-green-500",
				};
			default:
				return {
					label: props.source || "Unknown",
					bgColor: "bg-gray-100 dark:bg-gray-800",
					textColor: "text-gray-600 dark:text-gray-400",
					dotColor: "bg-gray-500",
				};
		}
	};

	const config = () => getBadgeConfig();
	const sizeClasses = () =>
		size() === "sm" ? "text-xs px-1.5 py-0.5" : "text-sm px-2 py-1";

	return (
		<span
			class={`inline-flex items-center gap-1.5 rounded-full font-medium ${config().bgColor} ${config().textColor} ${sizeClasses()}`}
		>
			<span class={`w-2 h-2 rounded-full ${config().dotColor}`} />
			{config().label}
		</span>
	);
};

export default ProviderBadge;
