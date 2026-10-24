
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_URL = "http://localhost:5000";

type Loan = {
  id: number;
  user_id: number;
  friend_name: string;
  amount: string;
  due_date: string;
  is_repaid: boolean;
  is_overdue: boolean;
};

type Summary = {
  total_lent: string;
  total_repaid: string;
  outstanding_amount: string;
  overdue_amount: string;
};

const emptySummary: Summary = {
  total_lent: "0",
  total_repaid: "0",
  outstanding_amount: "0",
  overdue_amount: "0",
};

function notify(message: string) {
  if (Platform.OS === "web") {
    window.alert(message);
  } else {
    Alert.alert("MiniLedger", message);
  }
}

function formatMoney(value: string | number) {
  return Number(value).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });
}

function formatDate(value: string) {
  const date = value.slice(0, 10);
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

export default function Index() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [userPhone, setUserPhone] = useState("");
  const [loans, setLoans] = useState<Loan[]>([]);
  const [summary, setSummary] = useState<Summary>(emptySummary);
  const [friendName, setFriendName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const request = async (path: string, options?: RequestInit) => {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Something went wrong");
    }

    return data;
  };

  const loadDashboard = useCallback(async (id: number) => {
    setLoading(true);
    setError("");

    try {
      const [loanData, summaryData] = await Promise.all([
        request(`/api/loans?userId=${id}`),
        request(`/api/summary?userId=${id}`),
      ]);

      setLoans(loanData.loans);
      setSummary(summaryData.summary);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load your loans"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userId !== null) {
      void loadDashboard(userId);
    }
  }, [userId, loadDashboard]);

  const sendOtp = async () => {
    if (!/^\+?[0-9]{10,15}$/.test(phone.trim())) {
      notify("Enter a valid phone number with 10–15 digits.");
      return;
    }

    setSaving(true);

    try {
      const data = await request("/api/auth/send-otp", {
        method: "POST",
        body: JSON.stringify({ phone: phone.trim() }),
      });

      setOtpSent(true);
      notify(data.message);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Could not send OTP");
    } finally {
      setSaving(false);
    }
  };

  const verifyOtp = async () => {
    if (!/^\d{6}$/.test(otp.trim())) {
      notify("Enter the six-digit OTP from the backend terminal.");
      return;
    }

    setSaving(true);

    try {
      const data = await request("/api/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ phone: phone.trim(), otp: otp.trim() }),
      });

      setUserId(data.user.id);
      setUserPhone(data.user.phone);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSaving(false);
    }
  };

  const addLoan = async () => {
    if (!friendName.trim()) {
      notify("Enter your friend's name.");
      return;
    }

    if (!amount.trim() || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      notify("Enter an amount greater than zero.");
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      notify("Enter the due date in YYYY-MM-DD format.");
      return;
    }

    if (userId === null) return;

    setSaving(true);

    try {
      await request("/api/loans", {
        method: "POST",
        body: JSON.stringify({
          userId,
          friendName: friendName.trim(),
          amount: Number(amount),
          dueDate,
        }),
      });

      setFriendName("");
      setAmount("");
      setDueDate("");
      setShowForm(false);
      await loadDashboard(userId);
      notify("Loan added successfully.");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Could not add loan");
    } finally {
      setSaving(false);
    }
  };

  const repayLoan = async (loanId: number) => {
    if (userId === null) return;

    try {
      await request(`/api/loans/${loanId}/repay`, {
        method: "PATCH",
        body: JSON.stringify({ userId }),
      });

      await loadDashboard(userId);
      notify("Loan marked as repaid.");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Could not update loan");
    }
  };

  if (userId === null) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.loginPage}>
          <View style={styles.brandMark}>
            <Text style={styles.brandMarkText}>M</Text>
          </View>

          <Text style={styles.brandName}>MiniLedger</Text>
          <Text style={styles.loginTitle}>Your money,{"\n"}kept in balance.</Text>
          <Text style={styles.loginDescription}>
            A simple, personal space to keep track of money lent to friends.
          </Text>

          <View style={styles.loginCard}>
            <Text style={styles.fieldLabel}>PHONE NUMBER</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="e.g. 9876543210"
              placeholderTextColor="#9A9A94"
              keyboardType="phone-pad"
              maxLength={16}
              editable={!otpSent}
            />

            {otpSent && (
              <>
                <Text style={styles.fieldLabel}>ONE-TIME PASSWORD</Text>
                <TextInput
                  style={styles.input}
                  value={otp}
                  onChangeText={setOtp}
                  placeholder="Enter 6-digit OTP"
                  placeholderTextColor="#9A9A94"
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <Text style={styles.helperText}>
                  Check the backend terminal for your mock OTP.
                </Text>
              </>
            )}

            <TouchableOpacity
              style={[styles.primaryButton, saving && styles.disabledButton]}
              onPress={otpSent ? verifyOtp : sendOtp}
              disabled={saving}
            >
              <Text style={styles.primaryButtonText}>
                {saving
                  ? "Please wait..."
                  : otpSent
                    ? "Verify & continue  →"
                    : "Continue with phone  →"}
              </Text>
            </TouchableOpacity>

            {otpSent && (
              <TouchableOpacity
                style={styles.textButton}
                onPress={() => {
                  setOtpSent(false);
                  setOtp("");
                }}
              >
                <Text style={styles.textButtonText}>Change phone number</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.footerText}>
            PRIVATE BY DESIGN  ·  SIMPLE BY NATURE
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <View style={styles.smallBrandMark}>
              <Text style={styles.smallBrandMarkText}>M</Text>
            </View>
            <Text style={styles.topBrandName}>MiniLedger</Text>
          </View>
          <View style={styles.profileCircle}>
            <Text style={styles.profileInitial}>
              {userPhone.slice(-1) || "U"}
            </Text>
          </View>
        </View>

        <Text style={styles.eyebrow}>YOUR PERSONAL LEDGER</Text>
        <Text style={styles.pageTitle}>Money, accounted for.</Text>
        <Text style={styles.pageSubtitle}>
          A clear picture of what you have lent and what is still owed.
        </Text>

        <View style={styles.summaryCard}>
          <View style={styles.summaryHeading}>
            <Text style={styles.summaryLabel}>TOTAL LENT</Text>
            <View style={styles.summaryIcon}>
              <Text style={styles.summaryIconText}>↗</Text>
            </View>
          </View>
          <Text style={styles.totalAmount}>{formatMoney(summary.total_lent)}</Text>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryBottom}>
            <View style={styles.summaryStat}>
              <Text style={styles.statLabel}>REPAID</Text>
              <Text style={styles.statValue}>
                {formatMoney(summary.total_repaid)}
              </Text>
            </View>
            <View style={styles.statSeparator} />
            <View style={styles.summaryStat}>
              <Text style={styles.statLabel}>OUTSTANDING</Text>
              <Text style={styles.statValue}>
                {formatMoney(summary.outstanding_amount)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.overdueBanner}>
          <View style={styles.overdueDot} />
          <View style={styles.overdueTextContainer}>
            <Text style={styles.overdueTitle}>Overdue balance</Text>
            <Text style={styles.overdueCaption}>
              Unpaid entries past their due date
            </Text>
          </View>
          <Text style={styles.overdueAmount}>
            {formatMoney(summary.overdue_amount)}
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Your entries</Text>
            <Text style={styles.sectionSubtitle}>
              {loans.length} {loans.length === 1 ? "record" : "records"} in your ledger
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowForm(!showForm)}
          >
            <Text style={styles.addButtonText}>
              {showForm ? "Cancel" : "+ Add loan"}
            </Text>
          </TouchableOpacity>
        </View>

        {showForm && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>New loan entry</Text>

            <Text style={styles.fieldLabel}>FRIEND'S NAME</Text>
            <TextInput
              style={styles.input}
              value={friendName}
              onChangeText={setFriendName}
              placeholder="Who did you lend to?"
              placeholderTextColor="#9A9A94"
              maxLength={100}
            />

            <Text style={styles.fieldLabel}>AMOUNT (₹)</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="e.g. 1500"
              placeholderTextColor="#9A9A94"
              keyboardType="decimal-pad"
            />

            <Text style={styles.fieldLabel}>DUE DATE</Text>
            <TextInput
              style={styles.input}
              value={dueDate}
              onChangeText={setDueDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9A9A94"
              maxLength={10}
            />

            <TouchableOpacity
              style={[styles.primaryButton, saving && styles.disabledButton]}
              onPress={addLoan}
              disabled={saving}
            >
              <Text style={styles.primaryButtonText}>
                {saving ? "Saving..." : "Save loan entry  →"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              onPress={() => userId !== null && loadDashboard(userId)}
            >
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {loading ? (
          <ActivityIndicator size="large" color="#426B52" />
        ) : loans.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>＋</Text>
            <Text style={styles.emptyTitle}>A fresh start</Text>
            <Text style={styles.emptyDescription}>
              Your ledger is empty. Add your first loan to start keeping track.
            </Text>
          </View>
        ) : (
          loans.map((loan) => {
            const overdue = loan.is_overdue && !loan.is_repaid;

            return (
              <View
                key={loan.id}
                style={[
                  styles.loanCard,
                  overdue && styles.overdueLoanCard,
                  loan.is_repaid && styles.repaidLoanCard,
                ]}
              >
                <View style={styles.loanTopRow}>
                  <View style={styles.friendAvatar}>
                    <Text style={styles.friendAvatarText}>
                      {loan.friend_name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.friendDetails}>
                    <Text style={styles.friendName}>{loan.friend_name}</Text>
                    <Text style={styles.dueDate}>
                      Due {formatDate(loan.due_date)}
                    </Text>
                  </View>
                  <View style={styles.loanAmountBlock}>
                    <Text style={styles.loanAmount}>
                      {formatMoney(loan.amount)}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        overdue && styles.overdueBadge,
                        loan.is_repaid && styles.repaidBadge,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          overdue && styles.overdueStatusText,
                          loan.is_repaid && styles.repaidStatusText,
                        ]}
                      >
                        {loan.is_repaid
                          ? "REPAID"
                          : overdue
                            ? "OVERDUE"
                            : "PENDING"}
                      </Text>
                    </View>
                  </View>
                </View>

                {!loan.is_repaid && (
                  <TouchableOpacity
                    style={styles.repayButton}
                    onPress={() => repayLoan(loan.id)}
                  >
                    <Text style={styles.repayButtonText}>Mark as repaid  ✓</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}

        <View style={styles.bottomNote}>
          <Text style={styles.bottomNoteText}>
            A little clarity goes a long way.
          </Text>
          <Text style={styles.bottomBrand}>MINILEDGER © 2026</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7F7F2",
  },
  page: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 48,
  },
  loginPage: {
    flexGrow: 1,
    width: "100%",
    maxWidth: 500,
    alignSelf: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingVertical: 36,
  },
  brandMark: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#426B52",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  brandMarkText: {
    color: "#FFFFFF",
    fontSize: 29,
    fontWeight: "800",
  },
  brandName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#426B52",
    letterSpacing: 0.4,
    marginBottom: 35,
  },
  loginTitle: {
    fontSize: 43,
    lineHeight: 49,
    fontWeight: "700",
    letterSpacing: -1.5,
    color: "#222D25",
  },
  loginDescription: {
    fontSize: 15,
    lineHeight: 23,
    color: "#777B73",
    marginTop: 13,
    marginBottom: 28,
    maxWidth: 350,
  },
  loginCard: {
    backgroundColor: "#FFFFFF",
    padding: 22,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E9EAE2",
  },
  fieldLabel: {
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: "800",
    color: "#72786F",
    marginTop: 17,
    marginBottom: 9,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#E2E5DC",
    backgroundColor: "#FBFCF8",
    borderRadius: 11,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: "#26352B",
  },
  helperText: {
    color: "#777B73",
    fontSize: 12,
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: "#426B52",
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderRadius: 11,
    alignItems: "center",
    marginTop: 22,
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  textButton: {
    alignItems: "center",
    marginTop: 14,
  },
  textButtonText: {
    color: "#426B52",
    fontSize: 13,
    fontWeight: "600",
  },
  footerText: {
    textAlign: "center",
    fontSize: 9,
    letterSpacing: 2,
    color: "#999D93",
    marginTop: 32,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 38,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  smallBrandMark: {
    height: 36,
    width: 36,
    borderRadius: 12,
    backgroundColor: "#426B52",
    alignItems: "center",
    justifyContent: "center",
  },
  smallBrandMarkText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
  },
  topBrandName: {
    color: "#2D4032",
    fontSize: 18,
    fontWeight: "700",
  },
  profileCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#E6EDE3",
    alignItems: "center",
    justifyContent: "center",
  },
  profileInitial: {
    color: "#426B52",
    fontWeight: "800",
    fontSize: 15,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
    color: "#64816A",
    marginBottom: 10,
  },
  pageTitle: {
    color: "#25352A",
    fontSize: 32,
    lineHeight: 39,
    fontWeight: "700",
    letterSpacing: -1,
  },
  pageSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: "#81857B",
    marginTop: 9,
    marginBottom: 26,
    maxWidth: 470,
  },
  summaryCard: {
    backgroundColor: "#355E46",
    padding: 24,
    borderRadius: 22,
    marginBottom: 14,
  },
  summaryHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 10,
    letterSpacing: 2,
    color: "#D3E2D1",
    fontWeight: "800",
  },
  summaryIcon: {
    height: 34,
    width: 34,
    borderRadius: 12,
    backgroundColor: "#4C745B",
    alignItems: "center",
    justifyContent: "center",
  },
  summaryIconText: {
    color: "#FFFFFF",
    fontSize: 22,
  },
  totalAmount: {
    color: "#FFFFFF",
    fontSize: 37,
    fontWeight: "700",
    letterSpacing: -1,
    marginTop: 13,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "#62806A",
    marginVertical: 20,
  },
  summaryBottom: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryStat: {
    flex: 1,
  },
  statLabel: {
    color: "#C7D8C8",
    fontSize: 9,
    letterSpacing: 1.3,
    fontWeight: "700",
    marginBottom: 8,
  },
  statValue: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  statSeparator: {
    width: 1,
    height: 36,
    backgroundColor: "#62806A",
    marginHorizontal: 18,
  },
  overdueBanner: {
    backgroundColor: "#FFF3EE",
    borderColor: "#F2D8CB",
    borderWidth: 1,
    borderRadius: 15,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 36,
  },
  overdueDot: {
    height: 9,
    width: 9,
    borderRadius: 5,
    backgroundColor: "#CB6546",
    marginRight: 12,
  },
  overdueTextContainer: {
    flex: 1,
  },
  overdueTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#873E2C",
  },
  overdueCaption: {
    fontSize: 11,
    color: "#A16D5A",
    marginTop: 4,
  },
  overdueAmount: {
    fontSize: 15,
    fontWeight: "800",
    color: "#9B432C",
    marginLeft: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 17,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#29372D",
    letterSpacing: -0.4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#888D82",
    marginTop: 5,
  },
  addButton: {
    borderWidth: 1,
    borderColor: "#426B52",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  addButtonText: {
    color: "#426B52",
    fontSize: 12,
    fontWeight: "800",
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7E9E1",
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#29372D",
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E8EAE3",
    borderRadius: 18,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 29,
    color: "#426B52",
    backgroundColor: "#EAF0E7",
    width: 52,
    height: 52,
    textAlign: "center",
    textAlignVertical: "center",
    borderRadius: 17,
    overflow: "hidden",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#29372D",
  },
  emptyDescription: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    color: "#898D83",
    marginTop: 8,
    maxWidth: 300,
  },
  loanCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E8EAE3",
    borderRadius: 17,
    padding: 17,
    marginBottom: 12,
  },
  overdueLoanCard: {
    borderColor: "#E8B6A4",
    backgroundColor: "#FFFAF7",
  },
  repaidLoanCard: {
    backgroundColor: "#F8FAF6",
  },
  loanTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  friendAvatar: {
    height: 43,
    width: 43,
    borderRadius: 14,
    backgroundColor: "#E9EFE5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  friendAvatarText: {
    color: "#426B52",
    fontWeight: "800",
    fontSize: 17,
  },
  friendDetails: {
    flex: 1,
    minWidth: 0,
  },
  friendName: {
    fontSize: 15,
    color: "#29372D",
    fontWeight: "700",
  },
  dueDate: {
    color: "#898D83",
    fontSize: 11,
    marginTop: 5,
  },
  loanAmountBlock: {
    alignItems: "flex-end",
    marginLeft: 8,
  },
  loanAmount: {
    fontSize: 15,
    fontWeight: "800",
    color: "#29372D",
  },
  statusBadge: {
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 4,
    marginTop: 7,
    backgroundColor: "#F5EBD4",
  },
  overdueBadge: {
    backgroundColor: "#F8DDD3",
  },
  repaidBadge: {
    backgroundColor: "#DFEDE0",
  },
  statusText: {
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.8,
    color: "#866728",
  },
  overdueStatusText: {
    color: "#A3432C",
  },
  repaidStatusText: {
    color: "#426B52",
  },
  repayButton: {
    borderTopWidth: 1,
    borderTopColor: "#ECEDE7",
    marginTop: 16,
    paddingTop: 13,
    alignItems: "center",
  },
  repayButtonText: {
    color: "#426B52",
    fontWeight: "700",
    fontSize: 12,
  },
  errorCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#FFF0ED",
    marginBottom: 16,
  },
  errorText: {
    color: "#A3432C",
    fontSize: 13,
  },
  retryText: {
    color: "#426B52",
    fontWeight: "700",
    marginTop: 10,
  },
  bottomNote: {
    alignItems: "center",
    paddingTop: 35,
    paddingBottom: 10,
  },
  bottomNoteText: {
    color: "#84897E",
    fontSize: 12,
    fontStyle: "italic",
  },
  bottomBrand: {
    color: "#A1A49B",
    fontSize: 9,
    letterSpacing: 1.8,
    marginTop: 14,
  },
});
