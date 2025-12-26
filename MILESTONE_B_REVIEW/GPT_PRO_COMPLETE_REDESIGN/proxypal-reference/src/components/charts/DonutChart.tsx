import type { EChartsOption } from "echarts";
import { createMemo } from "solid-js";
import { EChartsWrapper } from "./EChartsWrapper";

export interface DonutChartData {
	name: string;
	value: number;
	color?: string;
}

interface DonutChartProps {
	data: DonutChartData[];
	title?: string;
	centerText?: string;
	centerSubtext?: string;
	onClick?: (name: string) => void;
	class?: string;
}

// High-contrast palette for dark mode visibility
// Primary blue + complementary colors with good distinction
const COLORS = [
	"#3b82f6", // blue-500 (primary)
	"#38bdf8", // sky-400 (contrast)
	"#a78bfa", // violet-400
	"#fb923c", // orange-400
	"#f472b6", // pink-400
	"#22d3ee", // cyan-400
	"#facc15", // yellow-400
	"#94a3b8", // slate-400
];

export function DonutChart(props: DonutChartProps) {
	const option = createMemo(
		(): EChartsOption => ({
			tooltip: {
				trigger: "item",
				formatter: "{b}: {c} ({d}%)",
			},
			legend: {
				orient: "vertical",
				right: 10,
				top: "center",
				itemGap: 12,
				textStyle: { fontSize: 12 },
			},
			series: [
				{
					type: "pie",
					radius: ["50%", "75%"],
					center: ["35%", "50%"],
					avoidLabelOverlap: true,
					itemStyle: {
						borderRadius: 6,
						borderColor: "transparent",
						borderWidth: 2,
					},
					label: { show: false },
					emphasis: {
						label: {
							show: true,
							fontSize: 14,
							fontWeight: "bold",
						},
						itemStyle: {
							shadowBlur: 10,
							shadowOffsetX: 0,
							shadowColor: "rgba(0, 0, 0, 0.3)",
						},
					},
					labelLine: { show: false },
					data: props.data.map((item, index) => ({
						name: item.name,
						value: item.value,
						itemStyle: {
							color: item.color || COLORS[index % COLORS.length],
						},
					})),
					animationType: "scale",
					animationEasing: "elasticOut",
					animationDuration: 800,
				},
			],
		}),
	);

	const handleClick = (params: unknown) => {
		const p = params as { name?: string };
		if (props.onClick && p.name) {
			props.onClick(p.name);
		}
	};

	return (
		<EChartsWrapper
			option={option()}
			class={props.class}
			onChartClick={handleClick}
		/>
	);
}
