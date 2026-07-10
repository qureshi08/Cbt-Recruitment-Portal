import CreateBatchForm from "@/components/program/CreateBatchForm";

export default function NewBatchPage() {
    return (
        <div className="space-y-5 animate-in fade-in duration-500 max-w-lg">
            <div>
                <span className="section-tag">CGAP Academy</span>
                <h1
                    className="text-heading font-bold tracking-tight"
                    style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: "clamp(1.4rem, 2.2vw, 1.75rem)",
                        letterSpacing: "-0.02em",
                        lineHeight: 1.2,
                    }}
                >
                    Create <span className="italic-accent">Batch</span>
                </h1>
                <p className="text-[12px] text-muted mt-1.5 leading-relaxed">
                    Starts the record everything else — checklist, mentor, fellows — hangs off.
                </p>
            </div>

            <div className="bg-white border border-border rounded-[12px] shadow-soft p-6">
                <CreateBatchForm />
            </div>
        </div>
    );
}
