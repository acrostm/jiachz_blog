"use client";

import React, { useState, useEffect, useRef } from "react";
import io, { Socket } from "socket.io-client";
import { Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Message {
    id: string;
    user: {
        name: string;
        avatar: string;
        initials: string;
    };
    content: string;
    timestamp: string;
    channel?: string;
}

interface Channel {
    id: string;
    name: string;
}

interface User {
    username: string;
    online: boolean;
}

const channels: Channel[] = [
    { id: "general", name: "General" },
    { id: "tech", name: "Tech" },
    { id: "support", name: "Support" },
];

const initialMessages: Record<string, Message[]> = {
    general: [],
    tech: [],
    support: [],
};

export default function ChatPage() {
    const [username, setUsername] = useState<string>("");
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentChannel, setCurrentChannel] = useState("general");
    const [messages, setMessages] = useState(initialMessages);
    const [newMessage, setNewMessage] = useState("");
    const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
    const [existingUsers, setExistingUsers] = useState<User[]>([]);
    const [isNewUser, setIsNewUser] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const socketRef = useRef<Socket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 获取历史用户列表
    useEffect(() => {
        const fetchUsers = async (retries = 3) => {
            try {
                const response = await fetch("/api/socket/users");
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                
                if (data.users && Array.isArray(data.users)) {
                    const formattedUsers = data.users.map(user => ({
                        username: user.username,
                        online: user.online
                    }));
                    setExistingUsers(formattedUsers);
                } else {
                    console.error("用户数据格式不正确:", data);
                    if(retries > 0) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        return fetchUsers(retries - 1);
                    }
                    setExistingUsers([]);
                }
            } catch (error) {
                console.error("获取历史用户失败:", error);
                if(retries > 0) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    return fetchUsers(retries - 1);
                }
                setExistingUsers([]);
            }
        };

        fetchUsers();
    }, []);

    // 初始化Socket.IO服务
    useEffect(() => {
        const initSocketService = async () => {
            try {
                await fetch("/api/socket");
                console.log("Socket.IO服务初始化请求已发送");
            } catch (error) {
                console.error("Socket服务初始化失败:", error);
                setConnectionError("无法初始化聊天服务");
            }
        };
        
        initSocketService();
    }, []);

    // 自动滚动到最新消息
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // 登录后初始化socket连接
    useEffect(() => {
        if (isLoggedIn && !socketRef.current) {
            setIsConnecting(true);
            setConnectionError(null);
            
            // 创建Socket.IO连接
            const socketUrl = process.env.NEXT_PUBLIC_API_URL || window.location.origin;
            socketRef.current = io(socketUrl, { 
                path: "/api/socket",
                addTrailingSlash: false,
                transports: ["polling", "websocket"],
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                timeout: 20000,
                forceNew: true,
                autoConnect: true,
                withCredentials: true,
                auth: {
                    token: localStorage.getItem('chat-token')
                }
            });
            
            console.log("Socket.IO客户端初始化完成，连接URL:", socketUrl);

            // 连接事件处理
            socketRef.current.on("connect", () => {
                console.log("已连接到Socket.IO服务");
                setIsConnecting(false);
                setConnectionError(null);
                
                // 连接成功后设置用户名
                socketRef.current?.emit("setUsername", username);
            });
            
            // 错误处理
            socketRef.current.on("connect_error", (error) => {
                console.error("Socket.IO连接错误:", error);
                setIsConnecting(false);
                setConnectionError("连接服务器失败，请稍后重试");
            });
            
            socketRef.current.on("reconnect_attempt", (attemptNumber) => {
                console.log(`尝试重连 (${attemptNumber})`);
                setIsConnecting(true);
            });
            
            socketRef.current.on("reconnect_failed", () => {
                console.error("重连失败");
                setIsConnecting(false);
                setConnectionError("重连失败，请刷新页面重试");
            });

            // 消息处理
            socketRef.current.on("message", ({ channel, message }) => {
                setMessages((prev) => ({
                    ...prev,
                    [channel]: [...prev[channel], message],
                }));
            });

            // 历史消息处理
            socketRef.current.on("messageHistory", ({ channel, messages: historyMessages }) => {
                setMessages((prev) => ({
                    ...prev,
                    [channel]: historyMessages,
                }));
            });

            // 在线用户列表更新
            socketRef.current.on("onlineUsers", (users: string[]) => {
                setOnlineUsers(users);
            });
        }
        
        // 清理函数
        return () => {
            if (socketRef.current) {
                socketRef.current.off("message");
                socketRef.current.off("messageHistory");
                socketRef.current.off("onlineUsers");
                socketRef.current.off("connect");
                socketRef.current.off("connect_error");
                socketRef.current.off("reconnect_attempt");
                socketRef.current.off("reconnect_failed");
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [isLoggedIn, username]);

    // 切换频道
    useEffect(() => {
        if (socketRef.current && isLoggedIn) {
            socketRef.current.emit("join", currentChannel);
        }
    }, [currentChannel, isLoggedIn]);

    // 发送消息
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !socketRef.current) return;

        try {
            const message = {
                content: newMessage.trim()
            };

            socketRef.current.emit("message", { channel: currentChannel, message });
            setNewMessage("");
        } catch (error) {
            console.error("发送消息失败:", error);
            // 可以在这里添加错误提示UI
        }
    };

    // 用户登录
    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim()) return;
        setIsLoggedIn(true);
    };

    // 切换用户模式（新用户/已有用户）
    const handleToggleUserMode = () => {
        setIsNewUser(!isNewUser);
        setUsername("");
    };

    // 登录界面
    if (!isLoggedIn) {
        return (
            <div className="flex items-center justify-center py-12 px-4">
                <form onSubmit={handleLogin} className="p-6 border rounded-lg shadow-sm w-full max-w-md">
                    <h2 className="mb-6 text-xl font-semibold text-center">请{isNewUser ? "输入" : "选择"}用户名</h2>
                    
                    {isNewUser ? (
                        <Input
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="新用户名"
                            className="mb-4"
                        />
                    ) : (
                        <div className="mb-4">
                            {existingUsers.length > 0 ? (
                                <Select value={username} onValueChange={setUsername}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="选择历史用户名" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {existingUsers.map((user) => (
                                            <SelectItem key={user.username} value={user.username}>
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-2 h-2 rounded-full ${user.online ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                                    {user.username}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <div className="text-center text-muted-foreground py-2">
                                    加载用户列表中...
                                </div>
                            )}
                        </div>
                    )}
                    
                    <div className="flex flex-col gap-4">
                        <Button type="submit" disabled={!username.trim()} className="w-full">
                            加入聊天室
                        </Button>
                        <Button type="button" variant="outline" onClick={handleToggleUserMode} className="w-full">
                            {isNewUser ? "使用已有用户名" : "创建新用户名"}
                        </Button>
                    </div>
                </form>
            </div>
        );
    }

    // 连接中状态
    if (isConnecting) {
        return (
            <div className="flex items-center justify-center py-12 px-4">
                <div className="p-6 border rounded-lg shadow-sm w-full max-w-md text-center">
                    <h2 className="mb-4 text-xl font-semibold">连接中...</h2>
                    <p className="text-muted-foreground">正在连接到聊天服务器，请稍候</p>
                </div>
            </div>
        );
    }

    // 连接错误状态
    if (connectionError) {
        return (
            <div className="flex items-center justify-center py-12 px-4">
                <div className="p-6 border rounded-lg shadow-sm w-full max-w-md text-center">
                    <h2 className="mb-4 text-xl font-semibold text-red-500">连接错误</h2>
                    <p className="mb-4 text-muted-foreground">{connectionError}</p>
                    <Button onClick={() => window.location.reload()}>刷新页面</Button>
                </div>
            </div>
        );
    }

    // 连接中状态
    if (isConnecting) {
        return (
            <div className="flex items-center justify-center py-12 px-4">
                <div className="p-6 border rounded-lg shadow-sm w-full max-w-md text-center">
                    <h2 className="mb-4 text-xl font-semibold">连接中...</h2>
                    <p className="text-muted-foreground">正在连接到聊天服务器，请稍候</p>
                </div>
            </div>
        );
    }

    // 连接错误状态
    if (connectionError) {
        return (
            <div className="flex items-center justify-center py-12 px-4">
                <div className="p-6 border rounded-lg shadow-sm w-full max-w-md text-center">
                    <h2 className="mb-4 text-xl font-semibold text-red-500">连接错误</h2>
                    <p className="mb-4 text-muted-foreground">{connectionError}</p>
                    <Button onClick={() => window.location.reload()}>刷新页面</Button>
                </div>
            </div>
        );
    }

    // 聊天室界面
    return (
        <div className="container mx-auto py-6 px-4">
            <div className="flex flex-col md:flex-row gap-6 bg-background border rounded-lg shadow-sm overflow-hidden" style={{ height: "calc(100vh - 250px)" }}>
                {/* 左侧边栏：频道选择 & 在线用户 */}
                <div className="w-full md:w-64 border-r p-4 flex flex-col gap-4 bg-muted/20">
                    <h2 className="font-semibold text-lg">频道</h2>
                    <Select value={currentChannel} onValueChange={setCurrentChannel} className="md:hidden mb-2">
                        <SelectTrigger>
                            <SelectValue placeholder="选择频道" />
                        </SelectTrigger>
                        <SelectContent>
                            {channels.map((channel) => (
                                <SelectItem key={channel.id} value={channel.id}>
                                    # {channel.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <div className="space-y-2 hidden md:block">
                        {channels.map((channel) => (
                            <Button
                                key={channel.id}
                                variant={currentChannel === channel.id ? "secondary" : "ghost"}
                                className="w-full justify-start"
                                onClick={() => setCurrentChannel(channel.id)}
                            >
                                # {channel.name}
                            </Button>
                        ))}
                    </div>
                    <div className="mt-auto">
                        <h2 className="font-semibold text-lg mt-4">在线用户</h2>
                        <ul className="mt-2 space-y-1">
                            {onlineUsers.length > 0 ? (
                                onlineUsers.map((user, index) => (
                                    <li key={index} className="text-sm flex items-center gap-2">
                                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                        {user}
                                    </li>
                                ))
                            ) : (
                                <li className="text-sm text-muted-foreground">暂无在线用户</li>
                            )}
                        </ul>
                    </div>
                </div>

                {/* 聊天主区域 */}
                <div className="flex-1 flex flex-col">
                    <div className="border-b p-3">
                        <h1 className="font-semibold text-lg">#{currentChannel}</h1>
                    </div>

                    {/* 消息区域 */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages[currentChannel].map((message) => (
                            <Card key={message.id} className="p-3">
                                <div className="flex items-start gap-3">
                                    <Avatar>
                                        <AvatarImage src={message.user.avatar} alt={message.user.name} />
                                        <AvatarFallback>{message.user.initials}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold">{message.user.name}</span>
                                            <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                                        </div>
                                        <p className="mt-1 text-sm">{message.content}</p>
                                    </div>
                                </div>
                            </Card>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* 消息输入区域 */}
                    <form onSubmit={handleSendMessage} className="border-t p-4">
                        <div className="flex gap-2">
                            <Input
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="输入消息..."
                                className="flex-1"
                            />
                            <Button type="submit" disabled={!newMessage.trim()}>
                                <Send className="size-4" />
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}