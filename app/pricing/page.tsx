import Link from "next/link";

const tiers = [
  {
    name: "Hobby",
    price: "Free",
    period: "",
    description: "For exploring ideas.",
    features: [
      "30 generations / month",
      "Up to 3 projects",
      "Gemini Flash model",
      "Community support",
    ],
    cta: "Get started",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$20",
    period: "/ month",
    description: "For designers who ship.",
    features: [
      "Unlimited generations",
      "Unlimited projects",
      "All AI models (Claude, Gemini)",
      "Variant history & lineage",
      "Priority queue",
      "Email support",
    ],
    cta: "Start free trial",
    highlighted: true,
  },
  {
    name: "Team",
    price: "$40",
    period: "/ seat / month",
    description: "For design teams.",
    features: [
      "Everything in Pro",
      "Shared projects & workspaces",
      "Admin controls",
      "SSO",
      "Dedicated support",
    ],
    cta: "Contact us",
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <div
      style={{
        height: "100vh",
        background: "var(--background)",
        display: "flex",
        flexDirection: "column",
        overflow: "auto",
      }}
    >
      {/* Breadcrumb */}
      <div
        style={{
          padding: "14px 32px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexShrink: 0,
        }}
      >
        <Link
          href="/"
          style={{
            fontSize: 13,
            color: "var(--muted-foreground)",
            textDecoration: "none",
          }}
        >
          Soupcan
        </Link>
        <span style={{ fontSize: 13, color: "var(--border)" }}>/</span>
        <span style={{ fontSize: 13, color: "var(--foreground)", fontWeight: 500 }}>
          Pricing
        </span>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "64px 48px 80px",
        }}
      >
        <div style={{ marginBottom: 56 }}>
          <h1
            style={{
              fontSize: 40,
              fontWeight: 500,
              letterSpacing: "-0.02em",
              color: "var(--foreground)",
              marginBottom: 10,
            }}
          >
            Simple pricing
          </h1>
          <p style={{ fontSize: 15, color: "var(--muted-foreground)" }}>
            Start free. Upgrade when you need more.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20,
            width: "100%",
          }}
        >
          {tiers.map((tier) => (
            <div
              key={tier.name}
              style={{
                border: tier.highlighted
                  ? "1px solid var(--foreground)"
                  : "1px solid var(--border)",
                borderRadius: "var(--radius)",
                padding: "36px 32px",
                background: tier.highlighted ? "var(--card)" : "transparent",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ marginBottom: 28 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "var(--muted-foreground)",
                    marginBottom: 12,
                  }}
                >
                  {tier.name}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 6,
                    marginBottom: 10,
                  }}
                >
                  <span
                    style={{
                      fontSize: 42,
                      fontWeight: 500,
                      letterSpacing: "-0.03em",
                      color: "var(--foreground)",
                      lineHeight: 1,
                    }}
                  >
                    {tier.price}
                  </span>
                  {tier.period && (
                    <span style={{ fontSize: 13, color: "var(--muted-foreground)" }}>
                      {tier.period}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 13, color: "var(--muted-foreground)" }}>
                  {tier.description}
                </p>
              </div>

              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: "0 0 36px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {tier.features.map((f) => (
                  <li
                    key={f}
                    style={{
                      fontSize: 13,
                      color: "var(--foreground)",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <span
                      style={{
                        color: "var(--muted-foreground)",
                        fontSize: 14,
                        lineHeight: 1,
                        flexShrink: 0,
                      }}
                    >
                      —
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href="#"
                style={{
                  marginTop: "auto",
                  display: "block",
                  textAlign: "center",
                  padding: "10px 16px",
                  borderRadius: "var(--radius)",
                  fontSize: 13,
                  fontWeight: 500,
                  textDecoration: "none",
                  border: "1px solid var(--border)",
                  background: tier.highlighted ? "var(--foreground)" : "transparent",
                  color: tier.highlighted ? "var(--background)" : "var(--foreground)",
                  cursor: "pointer",
                }}
              >
                {tier.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
