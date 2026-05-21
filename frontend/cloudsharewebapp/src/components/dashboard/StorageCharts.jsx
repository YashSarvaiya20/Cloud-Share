import React from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatFileSize } from "../../util/fileUi";

const chartColors = ["#6366F1", "#A855F7", "#3B82F6", "#14B8A6"];

const buildTypeData = (files = []) => {
  const typeTotals = files.reduce((acc, file) => {
    const extension = String(file.name || "").split(".").pop()?.toLowerCase() || "other";
    const imageExt = ["png", "jpg", "jpeg", "gif", "webp", "svg"];
    const videoExt = ["mp4", "mov", "avi", "mkv", "webm"];
    const docExt = ["pdf", "doc", "docx", "txt", "ppt", "pptx", "xls", "xlsx", "csv"];

    let bucket = "Other";
    if (imageExt.includes(extension)) bucket = "Images";
    else if (videoExt.includes(extension)) bucket = "Videos";
    else if (docExt.includes(extension)) bucket = "Documents";

    acc[bucket] = (acc[bucket] || 0) + (Number(file.size) || 0);
    return acc;
  }, {});

  return Object.entries(typeTotals).map(([name, size]) => ({
    name,
    size,
    mb: Number((size / (1024 * 1024)).toFixed(2)),
  }));
};

const StorageCharts = ({ files = [] }) => {
  const typeData = buildTypeData(files);

  return (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      <div className="glass-card p-5 xl:col-span-5">
        <h3 className="text-sm font-semibold text-slate-800">Storage By File Type</h3>
        <div className="mt-4 h-64">
          {typeData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">Upload files to view usage chart.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={typeData} dataKey="size" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={4}>
                  {typeData.map((entry, index) => (
                    <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatFileSize(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="glass-card p-5 xl:col-span-7">
        <h3 className="text-sm font-semibold text-slate-800">Type Usage (MB)</h3>
        <div className="mt-4 h-64">
          {typeData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">No usage data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeData}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.25} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `${value} MB`} />
                <Bar dataKey="mb" radius={[8, 8, 0, 0]} fill="#6366F1" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </section>
  );
};

export default StorageCharts;
