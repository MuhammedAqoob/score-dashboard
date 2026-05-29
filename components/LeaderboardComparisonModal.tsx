"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useUserSubmissions } from "@/hooks/useUserSubmissions";
import {
  buildCategoryAverages,
  buildCategoryMaxScores,
  buildPeerComparisonData,
  getActiveValidatedSubmissions,
  PeerComparisonItem,
} from "@/services/analyticsService";
import { getEffectiveSubmissionScore } from "@/services/moderationUtils";
import { Submission } from "@/types/submission";

type LeaderboardComparisonModalProps = {
  currentUsername?: string;
  selectedUsername: string | null;
  onClose: () => void;
};

function getTopScore(submissions: Submission[]) {
  return getActiveValidatedSubmissions(submissions).reduce(
    (topScore, submission) =>
      Math.max(topScore, getEffectiveSubmissionScore(submission)),
    0,
  );
}

function getAverageScore(submissions: Submission[]) {
  const activeSubmissions = getActiveValidatedSubmissions(submissions);

  if (activeSubmissions.length === 0) {
    return 0;
  }

  const total = activeSubmissions.reduce(
    (sum, submission) => sum + getEffectiveSubmissionScore(submission),
    0,
  );

  return Math.round(total / activeSubmissions.length);
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function PeerComparisonChart({
  title,
  data,
  currentUsername,
  selectedUsername,
}: {
  title: string;
  data: PeerComparisonItem[];
  currentUsername: string;
  selectedUsername: string;
}) {
  const chartHeight = Math.max(420, data.length * 64 + 64);

  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <h3 className="font-semibold text-white">{title}</h3>
      {data.length === 0 ? (
        <p className="mt-4 rounded-md border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-400">
          Not enough category data to compare yet.
        </p>
      ) : (
        <div
          className="mt-4 w-full max-w-full min-w-0 overflow-hidden"
          style={{ height: chartHeight }}
        >
          <ResponsiveContainer
            height="100%"
            minHeight={1}
            minWidth={1}
            width="100%"
          >
            <BarChart
              data={data}
              layout="vertical"
              barCategoryGap={16}
              barGap={6}
              margin={{ bottom: 8, left: 24, right: 8, top: 8 }}
            >
              <CartesianGrid
                horizontal={false}
                stroke="#27272a"
                strokeDasharray="3 3"
              />
              <XAxis
                domain={[0, 100]}
                stroke="#71717a"
                tick={{ fill: "#a1a1aa", fontSize: 12 }}
                type="number"
              />
              <YAxis
                dataKey="name"
                interval={0}
                stroke="#71717a"
                tick={{ fill: "#d4d4d8", fontSize: 11 }}
                type="category"
                width={190}
              />
              <Tooltip
                contentStyle={{
                  background: "#09090b",
                  border: "1px solid #27272a",
                  borderRadius: 8,
                  color: "#f4f4f5",
                }}
                cursor={{ fill: "rgba(63, 63, 70, 0.24)" }}
              />
              <Legend wrapperStyle={{ color: "#d4d4d8", fontSize: 12 }} />
              <Bar
                animationDuration={700}
                dataKey="currentUser"
                fill="#22c55e"
                name={currentUsername}
                radius={[0, 8, 8, 0]}
              />
              <Bar
                animationDuration={700}
                dataKey="selectedUser"
                fill="#a1a1aa"
                name={selectedUsername}
                radius={[0, 8, 8, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

export function LeaderboardComparisonModal({
  currentUsername,
  selectedUsername,
  onClose,
}: LeaderboardComparisonModalProps) {
  const open = Boolean(selectedUsername);
  const {
    submissions: currentSubmissions,
    loading: currentLoading,
    error: currentError,
  } = useUserSubmissions(open && currentUsername ? currentUsername : undefined);
  const {
    submissions: selectedSubmissions,
    loading: selectedLoading,
    error: selectedError,
  } = useUserSubmissions(
    open && currentUsername && selectedUsername ? selectedUsername : undefined,
  );

  const topComparisonData = useMemo(
    () =>
      buildPeerComparisonData(
        buildCategoryMaxScores(currentSubmissions),
        buildCategoryMaxScores(selectedSubmissions),
      ),
    [currentSubmissions, selectedSubmissions],
  );
  const averageComparisonData = useMemo(
    () =>
      buildPeerComparisonData(
        buildCategoryAverages(currentSubmissions),
        buildCategoryAverages(selectedSubmissions),
      ),
    [currentSubmissions, selectedSubmissions],
  );

  if (!selectedUsername) {
    return null;
  }

  const loading = currentLoading || selectedLoading;
  const error = currentError || selectedError;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 px-4 py-6 backdrop-blur-sm sm:py-10"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/50">
        <header className="flex flex-col gap-4 border-b border-zinc-800 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
          <div className="min-w-0">
            <p className="text-sm font-medium text-emerald-400">
              Leaderboard comparison
            </p>
            <h2 className="mt-1 break-words text-2xl font-bold text-white">
              {currentUsername
                ? `${currentUsername} vs ${selectedUsername}`
                : "Performance comparison"}
            </h2>
          </div>
          <button
            className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-100 transition hover:bg-zinc-800"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </header>

        <div className="grid min-w-0 gap-5 p-4 sm:p-5">
          {!currentUsername && (
            <p className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-200">
              Log in to compare your performance with other users.
            </p>
          )}

          {currentUsername && loading && (
            <p className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-400">
              Loading comparison data...
            </p>
          )}

          {currentUsername && error && (
            <p className="rounded-xl border border-red-900/60 bg-red-950/20 px-4 py-3 text-sm text-red-100">
              {error}
            </p>
          )}

          {currentUsername && !loading && !error && (
            <>
              <section className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                  <h3 className="font-semibold text-white">Current User</h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <StatCard
                      label="Your Top Score"
                      value={`${getTopScore(currentSubmissions)}/100`}
                    />
                    <StatCard
                      label="Your Average Score"
                      value={`${getAverageScore(currentSubmissions)}/100`}
                    />
                  </div>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                  <h3 className="font-semibold text-white">
                    Selected Leaderboard User
                  </h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <StatCard
                      label="Their Top Score"
                      value={`${getTopScore(selectedSubmissions)}/100`}
                    />
                    <StatCard
                      label="Their Average Score"
                      value={`${getAverageScore(selectedSubmissions)}/100`}
                    />
                  </div>
                </div>
              </section>

              <PeerComparisonChart
                currentUsername={currentUsername}
                data={topComparisonData}
                selectedUsername={selectedUsername}
                title="Top Score Comparison"
              />
              <PeerComparisonChart
                currentUsername={currentUsername}
                data={averageComparisonData}
                selectedUsername={selectedUsername}
                title="Average Score Comparison"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
