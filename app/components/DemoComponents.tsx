"use client";

import { useState, useCallback } from "react";
import { useAccount } from "wagmi";
import {
  useMiniKit,
  useAddFrame,
  useOpenUrl,
} from "@coinbase/onchainkit/minikit";
import {
  Name,
  Identity,
  Address,
  Avatar,
  EthBalance,
} from "@coinbase/onchainkit/identity";
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from "@coinbase/onchainkit/wallet";
import {
  Transaction,
  TransactionButton,
  TransactionToast,
  TransactionToastAction,
  TransactionToastIcon,
  TransactionToastLabel,
  TransactionError,
  TransactionResponse,
  TransactionStatusAction,
  TransactionStatusLabel,
  TransactionStatus,
} from "@coinbase/onchainkit/transaction";
import { useEffect, useMemo } from "react";

type TaskType = "FOLLOW_USER" | "LIKE_CAST" | "RECAST_CAST" | "JOIN_CHANNEL";

interface TaskTargetData {
  userToFollow?: string;
  castHashToLike?: string;
  channelToJoin?: string;
  castHashToRecast?: string;
}

interface Task {
  id: number;
  title: string;
  description: string;
  taskType: TaskType;
  rewardPerParticipant: string;
  maxParticipants: number;
  currentParticipants: number;
  expiresAt: string;
  status: string;
  targetData: TaskTargetData;
  requiredActions?: number;
}

interface UserTask {
  id: number;
  status: string;
  task: Task;
  joinedAt: string;
  canClaim: boolean;
}

// Mock data - define mockTasks first
const mockTasks: Task[] = [
  {
    id: 1,
    title: "Complete Base Ecosystem Tasks",
    description: "Follow @buildwithbase AND recast their latest announcement",
    taskType: "FOLLOW_USER",
    rewardPerParticipant: "0.002",
    maxParticipants: 50,
    currentParticipants: 23,
    expiresAt: "2025-07-10T12:00:00Z",
    status: "ACTIVE",
    targetData: {
      userToFollow: "buildwithbase",
      castHashToRecast: "0x456def..."
    },
    requiredActions: 2
  },
  {
    id: 2,
    title: "Join Base Community",
    description: "Join the Base community channel",
    taskType: "JOIN_CHANNEL",
    rewardPerParticipant: "0.001",
    maxParticipants: 100,
    currentParticipants: 45,
    expiresAt: "2025-07-15T12:00:00Z",
    status: "ACTIVE",
    targetData: {
      channelToJoin: "base"
    }
  },
  {
    id: 3,
    title: "Like Community Cast",
    description: "Like the latest Base ecosystem update",
    taskType: "LIKE_CAST",
    rewardPerParticipant: "0.001",
    maxParticipants: 75,
    currentParticipants: 30,
    expiresAt: "2025-07-20T12:00:00Z",
    status: "ACTIVE",
    targetData: {
      castHashToLike: "0x789ghi..."
    }
  }
];

// Then define mockUserTasks using the tasks above
const mockUserTasks: UserTask[] = [
  {
    id: 1,
    status: "VERIFIED",
    task: mockTasks[0],
    joinedAt: "2025-07-01T10:00:00Z",
    canClaim: true
  },
  {
    id: 2,
    status: "PENDING",
    task: mockTasks[1],
    joinedAt: "2025-07-02T14:30:00Z",
    canClaim: false
  }
];

// Button component
function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  onClick,
  disabled = false,
  icon,
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  icon?: React.ReactNode;
}) {
  const baseClasses =
    "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0052FF] disabled:opacity-50 disabled:pointer-events-none";

  const variantClasses = {
    primary: "bg-[#8A63D2] hover:bg-[#7952CC] text-white",
    secondary: "bg-gray-600 hover:bg-gray-700 text-white",
    outline: "border border-[#8A63D2] hover:bg-[#8A63D2] hover:text-white text-[#8A63D2]",
    ghost: "hover:bg-gray-700 text-gray-300",
  };

  const sizeClasses = {
    sm: "text-xs px-2.5 py-1.5 rounded-md",
    md: "text-sm px-4 py-2 rounded-lg",
    lg: "text-base px-6 py-3 rounded-lg",
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className="flex items-center mr-2">{icon}</span>}
      {children}
    </button>
  );
}

// Icon component
function Icon({ name, size = "md", className = "" }: {
  name: "heart" | "star" | "check" | "plus" | "arrow-right";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const icons = {
    heart: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
    star: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    check: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    plus: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    ),
    "arrow-right": (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
      </svg>
    ),
  };

  return (
    <span className={`inline-block ${sizeClasses[size]} ${className}`}>
      {icons[name]}
    </span>
  );
}

// Card component
function Card({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-gray-800 backdrop-blur-md rounded-xl shadow-lg border border-gray-700 overflow-hidden transition-all hover:shadow-xl ${className}`}>
      {title && (
        <div className="px-5 py-3 border-b border-gray-700">
          <h3 className="text-lg font-medium text-white">{title}</h3>
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

// Task type icon
function TaskTypeIcon({ type }: { type: TaskType }) {
  const icons = {
    FOLLOW_USER: "👥",
    LIKE_CAST: "❤️",
    RECAST_CAST: "🔄",
    JOIN_CHANNEL: "📢"
  };
  return <span className="text-2xl">{icons[type]}</span>;
}

// Progress bar component
function ProgressBar({ current, max }: { current: number; max: number }) {
  const percentage = Math.min((current / max) * 100, 100);
  
  return (
    <div className="w-full bg-gray-700 rounded-full h-2">
      <div 
        className="bg-[#8A63D2] h-2 rounded-full transition-all duration-300"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

// Frame-optimized button component
function FrameButton({ 
  children, 
  onClick, 
  variant = "primary", 
  disabled = false,
  className = ""
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "success" | "warning";
  disabled?: boolean;
  className?: string;
}) {
  const variants = {
    primary: "bg-[#8A63D2] hover:bg-[#7952CC] text-white",
    secondary: "bg-gray-600 hover:bg-gray-700 text-white",
    success: "bg-green-600 hover:bg-green-700 text-white",
    warning: "bg-yellow-600 hover:bg-yellow-700 text-white"
  };

  return (
    <button
      className={`w-full py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

// Task card component
function TaskCard({ task, userTask, onJoin, onClaim }: {
  task: Task;
  userTask?: UserTask;
  onJoin: (taskId: number) => void;
  onClaim: (taskId: number) => void;
}) {
  const timeLeft = new Date(task.expiresAt).getTime() - Date.now();
  const hoursLeft = Math.max(0, Math.floor(timeLeft / (1000 * 60 * 60)));
  const isExpired = timeLeft <= 0;
  const isFull = task.currentParticipants >= task.maxParticipants;

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <TaskTypeIcon type={task.taskType} />
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-sm truncate">{task.title}</h3>
            <p className="text-gray-400 text-xs mt-1">{task.description}</p>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-green-400 font-bold text-sm">{task.rewardPerParticipant} ETH</div>
          <div className="text-xs text-gray-500">{hoursLeft}h left</div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-gray-400">
          <span>{task.currentParticipants}/{task.maxParticipants} joined</span>
          <span>{Math.round((task.currentParticipants / task.maxParticipants) * 100)}% filled</span>
        </div>
        <ProgressBar current={task.currentParticipants} max={task.maxParticipants} />
      </div>

      <div>
        {!userTask ? (
          <FrameButton 
            onClick={() => onJoin(task.id)}
            disabled={isExpired || isFull}
            variant={isExpired || isFull ? "secondary" : "primary"}
          >
            {isExpired ? "Expired" : isFull ? "Full" : "Join Task"}
          </FrameButton>
        ) : userTask.status === "PENDING" ? (
          <FrameButton variant="warning" disabled>
            ⏳ Verifying...
          </FrameButton>
        ) : userTask.status === "VERIFIED" && userTask.canClaim ? (
          <FrameButton 
            variant="success"
            onClick={() => onClaim(task.id)}
          >
            🎉 Claim {task.rewardPerParticipant} ETH
          </FrameButton>
        ) : userTask.status === "CLAIMED" ? (
          <FrameButton variant="secondary" disabled>
            ✅ Claimed
          </FrameButton>
        ) : (
          <FrameButton variant="secondary" disabled>
            📝 Complete Task
          </FrameButton>
        )}
      </div>
    </div>
  );
}

// User stats component
function UserStats() {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
      <h3 className="text-white font-semibold mb-3">Your Stats</h3>
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <div className="text-green-400 font-bold text-lg">0.0045</div>
          <div className="text-xs text-gray-400">ETH Earned</div>
        </div>
        <div className="text-center">
          <div className="text-blue-400 font-bold text-lg">7</div>
          <div className="text-xs text-gray-400">Tasks Done</div>
        </div>
        <div className="text-center">
          <div className="text-purple-400 font-bold text-lg">850</div>
          <div className="text-xs text-gray-400">Reputation</div>
        </div>
      </div>
    </div>
  );
}

// Todo List component
function TodoList() {
  const [todos, setTodos] = useState([
    { id: 1, text: "Learn about TaskReward", completed: false },
    { id: 2, text: "Join your first task", completed: true },
    { id: 3, text: "Earn ETH rewards", completed: false },
  ]);
  const [newTodo, setNewTodo] = useState("");

  const addTodo = () => {
    if (newTodo.trim() === "") return;
    const newId = todos.length > 0 ? Math.max(...todos.map((t) => t.id)) + 1 : 1;
    setTodos([...todos, { id: newId, text: newTodo, completed: false }]);
    setNewTodo("");
  };

  const toggleTodo = (id: number) => {
    setTodos(todos.map((todo) => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  return (
    <Card title="Get started">
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTodo()}
            placeholder="Add a new task..."
            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#8A63D2]"
          />
          <Button
            variant="primary"
            size="md"
            onClick={addTodo}
            icon={<Icon name="plus" size="sm" />}
          >
            Add
          </Button>
        </div>

        <ul className="space-y-2">
          {todos.map((todo) => (
            <li key={todo.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => toggleTodo(todo.id)}
                  className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    todo.completed
                      ? "bg-[#8A63D2] border-[#8A63D2]"
                      : "border-gray-400 bg-transparent"
                  }`}
                >
                  {todo.completed && <Icon name="check" size="sm" className="text-white" />}
                </button>
                <span className={`text-gray-300 ${todo.completed ? "line-through opacity-70" : ""}`}>
                  {todo.text}
                </span>
              </div>
              <button onClick={() => deleteTodo(todo.id)} className="text-gray-400 hover:text-white">
                ×
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

// Transaction card
function TransactionCard() {
  const { address } = useAccount();

  const calls = address ? [
    {
      to: address,
      data: "0x" as `0x${string}`,
      value: BigInt(0),
    },
  ] : [];

  const handleSuccess = useCallback(async (response: TransactionResponse) => {
    const transactionHash = response.transactionReceipts[0].transactionHash;
    console.log(`Transaction successful: ${transactionHash}`);
  }, []);

  return (
    <Card title="Demo Transaction">
      <div className="space-y-4">
        <p className="text-gray-400 text-sm">
          Test the OnchainKit transaction system with a demo transaction.
        </p>

        <div className="flex flex-col items-center">
          {address ? (
            <Transaction
              calls={calls}
              onSuccess={handleSuccess}
              onError={(error: TransactionError) =>
                console.error("Transaction failed:", error)
              }
            >
              <TransactionButton className="text-white text-md" />
              <TransactionStatus>
                <TransactionStatusAction />
                <TransactionStatusLabel />
              </TransactionStatus>
              <TransactionToast>
                <TransactionToastIcon />
                <TransactionToastLabel />
                <TransactionToastAction />
              </TransactionToast>
            </Transaction>
          ) : (
            <p className="text-yellow-400 text-sm text-center">
              Connect your wallet to test transactions
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

// Home component
function Home({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  return (
    <div className="space-y-6">
      <Card title="TaskReward - Earn ETH on Base">
        <p className="text-gray-400 mb-4">
          Join tasks, complete actions, and earn ETH rewards automatically verified through Farcaster.
        </p>
        <Button
          onClick={() => setActiveTab("browse")}
          icon={<Icon name="arrow-right" size="sm" />}
        >
          Browse Tasks
        </Button>
      </Card>

      <TodoList />
      <TransactionCard />
    </div>
  );
}

// Features component
function Features({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  return (
    <div className="space-y-6">
      <Card title="Key Features">
        <ul className="space-y-3 mb-4">
          <li className="flex items-start">
            <Icon name="check" className="text-[#8A63D2] mt-1 mr-2" />
            <span className="text-gray-400">
              Earn ETH for completing Farcaster tasks
            </span>
          </li>
          <li className="flex items-start">
            <Icon name="check" className="text-[#8A63D2] mt-1 mr-2" />
            <span className="text-gray-400">
              Automatic verification via Snapchain API
            </span>
          </li>
          <li className="flex items-start">
            <Icon name="check" className="text-[#8A63D2] mt-1 mr-2" />
            <span className="text-gray-400">
              Sponsored gas transactions on Base
            </span>
          </li>
          <li className="flex items-start">
            <Icon name="check" className="text-[#8A63D2] mt-1 mr-2" />
            <span className="text-gray-400">
              Create tasks for your community
            </span>
          </li>
        </ul>
        <Button variant="outline" onClick={() => setActiveTab("home")}>
          Back to Home
        </Button>
      </Card>
    </div>
  );
}

export default function App() {
  const { setFrameReady, isFrameReady, context } = useMiniKit();
  const [frameAdded, setFrameAdded] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [notification, setNotification] = useState<string | null>(null);

  const addFrame = useAddFrame();
  const openUrl = useOpenUrl();

  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  const handleAddFrame = useCallback(async () => {
    const frameAdded = await addFrame();
    setFrameAdded(Boolean(frameAdded));
  }, [addFrame]);

  const handleJoinTask = useCallback(async (taskId: number) => {
    console.log(`Joining task ${taskId}`);
    setNotification("🎉 Successfully joined task! Complete the action to earn rewards.");
    setTimeout(() => setNotification(null), 3000);
  }, []);

  // Simulate claiming rewards
const handleClaimReward = useCallback(async (taskId: number) => {
  console.log(`Claiming reward for task ${taskId}`);
  setNotification("💰 Claim transaction initiated! Check your wallet.");
  setTimeout(() => setNotification(null), 3000);
}, []);

  const getUserTask = (taskId: number) => {
    return mockUserTasks.find(ut => ut.task.id === taskId);
  };

  const saveFrameButton = useMemo(() => {
    if (context && !context.client.added) {
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAddFrame}
          className="text-[#0052FF] p-4"
          icon={<Icon name="plus" size="sm" />}
        >
          Save Frame
        </Button>
      );
    }

    if (frameAdded) {
      return (
        <div className="flex items-center space-x-1 text-sm font-medium text-[#0052FF]">
          <Icon name="check" size="sm" className="text-[#0052FF]" />
          <span>Saved</span>
        </div>
      );
    }

    return null;
  }, [context, frameAdded, handleAddFrame]);

  return (
    <div className="flex flex-col min-h-screen font-sans text-white bg-gray-900">
      <div className="w-full max-w-md mx-auto px-4 py-3">
        <header className="flex justify-between items-center mb-3 h-11">
          <div>
            <div className="flex items-center space-x-2">
              <Wallet className="z-10">
                <ConnectWallet>
                  <Name className="text-inherit" />
                </ConnectWallet>
                <WalletDropdown>
                  <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                    <Avatar />
                    <Name />
                    <Address />
                    <EthBalance />
                  </Identity>
                  <WalletDropdownDisconnect />
                </WalletDropdown>
              </Wallet>
            </div>
          </div>
          <div>{saveFrameButton}</div>
        </header>

        {/* Navigation */}
        <div className="flex space-x-1 mb-4">
          <button
            onClick={() => setActiveTab("home")}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
              activeTab === "home" ? "bg-[#8A63D2] text-white" : "bg-gray-700 text-gray-300"
            }`}
          >
            🏠 Home
          </button>
          <button
            onClick={() => setActiveTab("browse")}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
              activeTab === "browse" ? "bg-[#8A63D2] text-white" : "bg-gray-700 text-gray-300"
            }`}
          >
            🔍 Browse
          </button>
          <button
            onClick={() => setActiveTab("mytasks")}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
              activeTab === "mytasks" ? "bg-[#8A63D2] text-white" : "bg-gray-700 text-gray-300"
            }`}
          >
            📋 Tasks
          </button>
          <button
            onClick={() => setActiveTab("features")}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
              activeTab === "features" ? "bg-[#8A63D2] text-white" : "bg-gray-700 text-gray-300"
            }`}
          >
            ⭐ Features
          </button>
        </div>

        {/* Notification */}
        {notification && (
          <div className="bg-green-600 text-white p-3 text-center text-sm rounded-lg mb-4">
            {notification}
          </div>
        )}

        <main className="flex-1">
          {activeTab === "home" && <Home setActiveTab={setActiveTab} />}
          {activeTab === "features" && <Features setActiveTab={setActiveTab} />}
          
          {activeTab === "browse" && (
            <div className="space-y-4">
              <UserStats />
              <div className="space-y-3">
                <h2 className="text-white font-semibold">Available Tasks</h2>
                {mockTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    userTask={getUserTask(task.id)}
                    onJoin={handleJoinTask}
                    onClaim={handleClaimReward}
                  />
                ))}
              </div>
            </div>
          )}

          {activeTab === "mytasks" && (
            <div className="space-y-3">
              <h2 className="text-white font-semibold">My Tasks</h2>
              {mockUserTasks.length > 0 ? (
                mockUserTasks.map(userTask => (
                  <TaskCard
                    key={userTask.id}
                    task={userTask.task}
                    userTask={userTask}
                    onJoin={handleJoinTask}
                    onClaim={handleClaimReward}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-4xl mb-2">📝</div>
                  <p>No tasks joined yet</p>
                  <p className="text-xs">Browse tasks to start earning!</p>
                </div>
              )}
            </div>
          )}
        </main>

        <footer className="mt-6 pt-4 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 text-xs"
            onClick={() => openUrl("https://base.org/builders/minikit")}
          >
            Built on Base with MiniKit
          </Button>
        </footer>
      </div>
    </div>
  );
}