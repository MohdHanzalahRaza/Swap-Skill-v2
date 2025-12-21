import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { exchangeService } from "../services/exchangeService";
import toast from "react-hot-toast";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  MessageCircle,
  ArrowRight,
  Search,
  RefreshCw,
  Check,
  X,
  Video,
  FileText,
} from "lucide-react";
import Loader from "../components/common/Loader";
import { formatDate, timeAgo } from "../utils/helpers";

const Exchanges = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [exchanges, setExchanges] = useState([]);
  const [filter, setFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExchange, setSelectedExchange] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  useEffect(() => {
    fetchExchanges();
  }, [filter, statusFilter]);
  

  const fetchExchanges = async () => {
    try {
      setLoading(true);
      const params = { type: filter };
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }

      const response = await exchangeService.getMyExchanges(params);
      setExchanges(response.data || []);
    } catch (error) {
      console.error("Fetch exchanges error:", error);
      toast.error("Failed to load exchanges");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (exchangeId) => {
    try {
      await exchangeService.updateExchangeStatus(exchangeId, "accepted");
      toast.success("Exchange accepted! 🎉");
      fetchExchanges();
    } catch (error) {
      toast.error("Failed to accept exchange");
    }
  };

  const handleReject = async (exchangeId) => {
    if (!window.confirm("Are you sure you want to reject this request?"))
      return;

    try {
      await exchangeService.updateExchangeStatus(exchangeId, "rejected");
      toast.success("Exchange rejected");
      fetchExchanges();
    } catch (error) {
      toast.error("Failed to reject exchange");
    }
  };

  const handleComplete = async (exchangeId) => {
    if (!window.confirm("Mark this exchange as completed?")) return;

    try {
      await exchangeService.updateExchangeStatus(exchangeId, "completed");
      toast.success("Exchange completed! 🎊");
      fetchExchanges();
    } catch (error) {
      toast.error("Failed to complete exchange");
    }
  };

  const handleCancel = async (exchangeId) => {
    if (!window.confirm("Cancel this exchange request?")) return;

    try {
      await exchangeService.cancelExchange(exchangeId);
      toast.success("Exchange cancelled");
      fetchExchanges();
    } catch (error) {
      toast.error("Failed to cancel exchange");
    }
  };

  const handleSchedule = async () => {
    if (!scheduleDate || !scheduleTime) {
      toast.error("Please select date and time");
      return;
    }

    try {
      const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}`);

      await exchangeService.updateExchangeStatus(
        selectedExchange._id,
        "scheduled"
      );

      toast.success("Session scheduled! 📅");
      setShowScheduleModal(false);
      setScheduleDate("");
      setScheduleTime("");
      fetchExchanges();
    } catch (error) {
      toast.error("Failed to schedule session");
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: {
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: <Clock className="w-4 h-4" />,
        label: "Pending",
      },
      accepted: {
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: <Check className="w-4 h-4" />,
        label: "Accepted",
      },
      rejected: {
        color: "bg-red-100 text-red-800 border-red-200",
        icon: <XCircle className="w-4 h-4" />,
        label: "Rejected",
      },
      scheduled: {
        color: "bg-purple-100 text-purple-800 border-purple-200",
        icon: <Calendar className="w-4 h-4" />,
        label: "Scheduled",
      },
      completed: {
        color: "bg-green-100 text-green-800 border-green-200",
        icon: <CheckCircle className="w-4 h-4" />,
        label: "Completed",
      },
      cancelled: {
        color: "bg-gray-100 text-gray-800 border-gray-200",
        icon: <X className="w-4 h-4" />,
        label: "Cancelled",
      },
    };

    const badge = badges[status] || badges.pending;

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${badge.color}`}
      >
        {badge.icon}
        {badge.label}
      </span>
    );
  };

  const filteredExchanges = exchanges.filter((exchange) => {
    const otherUser =
      exchange.requester._id === user._id
        ? exchange.receiver
        : exchange.requester;
    const matchesSearch =
      otherUser.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exchange.skillOffered.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      exchange.skillWanted.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const stats = {
    total: exchanges.length,
    pending: exchanges.filter((e) => e.status === "pending").length,
    accepted: exchanges.filter(
      (e) => e.status === "accepted" || e.status === "scheduled"
    ).length,
    completed: exchanges.filter((e) => e.status === "completed").length,
  };

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            My Exchanges 🔄
          </h1>
          <p className="text-gray-600">
            Manage your skill exchange requests and sessions
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Total",
              value: stats.total,
              color: "from-blue-500 to-cyan-500",
              icon: <ArrowRight />,
            },
            {
              label: "Pending",
              value: stats.pending,
              color: "from-yellow-500 to-orange-500",
              icon: <Clock />,
            },
            {
              label: "Active",
              value: stats.accepted,
              color: "from-green-500 to-emerald-500",
              icon: <CheckCircle />,
            },
            {
              label: "Completed",
              value: stats.completed,
              color: "from-purple-500 to-pink-500",
              icon: <CheckCircle />,
            },
          ].map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`bg-gradient-to-br ${stat.color} text-white p-3 rounded-xl`}
                >
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search exchanges..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Exchanges</option>
              <option value="sent">Sent Requests</option>
              <option value="received">Received Requests</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <button
            onClick={fetchExchanges}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Exchanges List */}
        {filteredExchanges.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No exchanges found
            </h3>
            <p className="text-gray-600 mb-6">
              Start by browsing skills and sending exchange requests
            </p>
            <a
              href="/marketplace"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Browse Skills
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredExchanges.map((exchange) => {
              const otherUser =
                exchange.requester._id === user._id
                  ? exchange.receiver
                  : exchange.requester;
              const isSender = exchange.requester._id === user._id;
              const isReceiver = !isSender;

              return (
                <div
                  key={exchange._id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={otherUser.avatar}
                        alt={otherUser.name}
                        className="w-14 h-14 rounded-full object-cover border-2 border-gray-200"
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {otherUser.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {isSender ? "You requested" : "Requested from you"} •{" "}
                          {timeAgo(exchange.createdAt)}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(exchange.status)}
                  </div>

                  {/* Skills Exchange Visual */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 items-center">
                    <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                      <p className="text-xs text-gray-600 mb-2 font-medium">
                        {isSender ? "📚 You teach" : "🎯 They teach"}
                      </p>
                      <p className="font-semibold text-gray-900">
                        {exchange.skillOffered.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {exchange.skillOffered.category}
                      </p>
                    </div>

                    <div className="flex justify-center">
                      <div className="p-3 bg-gray-100 rounded-full">
                        <ArrowRight className="w-5 h-5 text-gray-600" />
                      </div>
                    </div>

                    <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                      <p className="text-xs text-gray-600 mb-2 font-medium">
                        {isSender ? "🎯 You learn" : "📚 They learn"}
                      </p>
                      <p className="font-semibold text-gray-900">
                        {exchange.skillWanted.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {exchange.skillWanted.category}
                      </p>
                    </div>
                  </div>

                  {/* Message */}
                  {exchange.message && (
                    <div className="p-4 bg-gray-50 rounded-lg mb-4">
                      <p className="text-sm text-gray-700">
                        <FileText className="w-4 h-4 inline mr-2" />
                        <strong>Message:</strong> {exchange.message}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                    {/* Receiver Actions - Pending */}
                    {isReceiver && exchange.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleAccept(exchange._id)}
                          className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                        >
                          <Check className="w-4 h-4" />
                          Accept
                        </button>
                        <button
                          onClick={() => handleReject(exchange._id)}
                          className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                        >
                          <X className="w-4 h-4" />
                          Reject
                        </button>
                      </>
                    )}

                    {/* Schedule Button - Accepted */}
                    {exchange.status === "accepted" && (
                      <button
                        onClick={() => {
                          setSelectedExchange(exchange);
                          setShowScheduleModal(true);
                        }}
                        className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                      >
                        <Calendar className="w-4 h-4" />
                        Schedule Session
                      </button>
                    )}

                    {/* Complete Button - Scheduled */}
                    {exchange.status === "scheduled" && (
                      <button
                        onClick={() => handleComplete(exchange._id)}
                        className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Mark Complete
                      </button>
                    )}

                    {/* ADDED MESSAGE BUTTON START */}
                    <button
                      onClick={() => navigate(`/messages?userId=${otherUser._id}`)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Message
                    </button>
                    {/* ADDED MESSAGE BUTTON END */}

                    {/* Cancel Button - For Sender */}
                    {isSender && exchange.status === "pending" && (
                      <button
                        onClick={() => handleCancel(exchange._id)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 border-2 border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors font-medium"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && selectedExchange && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Schedule Session 📅
            </h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time
                </label>
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowScheduleModal(false);
                  setScheduleDate("");
                  setScheduleTime("");
                }}
                className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSchedule}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Exchanges;