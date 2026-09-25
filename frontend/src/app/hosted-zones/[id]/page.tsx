"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ProtectedLayout from "@/components/ProtectedLayout";
import Modal from "@/components/Modal";
import Pagination from "@/components/Pagination";
import { api, apiErrorMessage } from "@/lib/api";
import { useToast } from "@/lib/toast-context";
import { DnsRecord, HostedZone, RecordList, RECORD_TYPES } from "@/types";

export default function HostedZoneDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { notify } = useToast();
  const zoneId = params?.id as string;

  const [zone, setZone] = useState<HostedZone | null>(null);
  const [records, setRecords] = useState<DnsRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState<DnsRecord | null>(null);
  const [showDelete, setShowDelete] = useState<DnsRecord | null>(null);

  const fetchZone = useCallback(async () => {
    try {
      const res = await api.get<HostedZone>(`/api/hosted-zones/${zoneId}`);
      setZone(res.data);
    } catch (err) {
      notify("error", "Failed to load hosted zone", apiErrorMessage(err));
      router.push("/hosted-zones");
    }
  }, [zoneId, notify, router]);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<RecordList>(`/api/hosted-zones/${zoneId}/records`, {
        params: {
          page,
          page_size: pageSize,
          search: search || undefined,
          record_type: typeFilter || undefined,
        },
      });
      setRecords(res.data.items);
      setTotal(res.data.total);
    } catch (err) {
      notify("error", "Failed to load records", apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [zoneId, page, search, typeFilter, notify]);

  useEffect(() => {
    if (zoneId) fetchZone();
  }, [zoneId, fetchZone]);

  useEffect(() => {
    if (zoneId) fetchRecords();
  }, [zoneId, fetchRecords]);

  useEffect(() => {
    setPage(1);
  }, [search, typeFilter]);

  const refreshAll = () => {
    fetchZone();
    fetchRecords();
  };

  return (
    <ProtectedLayout>
      <div className="p-6">
        <div className="text-sm text-awsGray mb-2">
          <Link href="/hosted-zones" className="text-awsBlue hover:underline">
            Hosted zones
          </Link>{" "}
          / <span>{zone?.name || "…"}</span>
        </div>

        <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-awsText">{zone?.name || "Loading…"}</h1>
            <p className="text-xs text-awsGray font-mono mt-0.5">Hosted zone ID: {zoneId}</p>
          </div>
          <button className="aws-btn-primary" onClick={() => setShowCreate(true)}>
            Create record
          </button>
        </div>

        {zone && (
          <div className="aws-panel p-4 mb-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-awsGray uppercase font-semibold">Type</p>
              <p className="text-awsText mt-0.5">{zone.private_zone ? "Private" : "Public"}</p>
            </div>
            <div>
              <p className="text-xs text-awsGray uppercase font-semibold">Record count</p>
              <p className="text-awsText mt-0.5">{zone.record_count}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-awsGray uppercase font-semibold">Comment</p>
              <p className="text-awsText mt-0.5">{zone.comment || "—"}</p>
            </div>
          </div>
        )}

        <div className="aws-panel">
          <div className="flex items-center gap-2 p-3 border-b border-awsBorder flex-wrap">
            <input
              className="aws-input max-w-xs"
              placeholder="Search records by name or value"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="aws-input max-w-[160px]"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All types</option>
              {[...RECORD_TYPES, "SOA"].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <span className="text-sm text-awsGray ml-auto">{total} record(s)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full aws-table">
              <thead>
                <tr>
                  <th>Record name</th>
                  <th>Type</th>
                  <th>Routing policy</th>
                  <th>TTL</th>
                  <th>Value / route traffic to</th>
                  <th className="w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={6} className="text-center text-awsGray py-6">
                      Loading…
                    </td>
                  </tr>
                )}
                {!loading && records.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-awsGray py-8">
                      No records found.
                    </td>
                  </tr>
                )}
                {!loading &&
                  records.map((rec) => {
                    const isDefault = rec.record_type === "NS" || rec.record_type === "SOA";
                    return (
                      <tr key={rec.id} className="hover:bg-[#fafafa] align-top">
                        <td className="font-medium">{rec.name}</td>
                        <td>
                          <span className="inline-block px-1.5 py-0.5 text-xs font-semibold rounded bg-[#eaeded] text-awsText">
                            {rec.record_type}
                          </span>
                        </td>
                        <td>{rec.routing_policy}</td>
                        <td>{rec.ttl}</td>
                        <td className="max-w-md">
                          <div className="flex flex-col gap-0.5">
                            {rec.values.map((v, i) => (
                              <span key={i} className="text-awsGray break-all font-mono text-xs">
                                {v}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          {isDefault && rec.name === zone?.name ? (
                            <span className="text-xs text-awsGray italic">System</span>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                className="text-awsBlue hover:underline text-xs"
                                onClick={() => setShowEdit(rec)}
                              >
                                Edit
                              </button>
                              <button
                                className="text-[#d13212] hover:underline text-xs"
                                onClick={() => setShowDelete(rec)}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
        </div>
      </div>

      {showCreate && zone && (
        <RecordFormModal
          zone={zone}
          onClose={() => setShowCreate(false)}
          onSaved={() => {
            setShowCreate(false);
            refreshAll();
          }}
        />
      )}

      {showEdit && zone && (
        <RecordFormModal
          zone={zone}
          record={showEdit}
          onClose={() => setShowEdit(null)}
          onSaved={() => {
            setShowEdit(null);
            refreshAll();
          }}
        />
      )}

      {showDelete && (
        <DeleteRecordModal
          zoneId={zoneId}
          record={showDelete}
          onClose={() => setShowDelete(null)}
          onDeleted={() => {
            setShowDelete(null);
            refreshAll();
          }}
        />
      )}
    </ProtectedLayout>
  );
}

function RecordFormModal({
  zone,
  record,
  onClose,
  onSaved,
}: {
  zone: HostedZone;
  record?: DnsRecord;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { notify } = useToast();
  const isEdit = !!record;
  const [name, setName] = useState(record ? record.name.replace(new RegExp(`\\.?${zone.name}$`), "") : "");
  const [recordType, setRecordType] = useState(record?.record_type || "A");
  const [ttl, setTtl] = useState(record?.ttl ?? 300);
  const [valuesText, setValuesText] = useState(record?.values.join("\n") || "");
  const [routingPolicy, setRoutingPolicy] = useState(record?.routing_policy || "Simple");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    setSubmitting(true);
    const values = valuesText.split("\n").map((v) => v.trim()).filter(Boolean);
    try {
      if (isEdit && record) {
        await api.put(`/api/hosted-zones/${zone.id}/records/${record.id}`, {
          ttl,
          values,
          routing_policy: routingPolicy,
        });
        notify("success", "Record updated");
      } else {
        const fullName = name.trim() ? `${name.trim()}.${zone.name}` : zone.name;
        await api.post(`/api/hosted-zones/${zone.id}/records`, {
          name: fullName,
          record_type: recordType,
          ttl,
          values,
          routing_policy: routingPolicy,
        });
        notify("success", "Record created");
      }
      onSaved();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={isEdit ? "Edit record" : "Create record"}
      onClose={onClose}
      footer={
        <>
          <button className="aws-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="aws-btn-primary" disabled={submitting || !valuesText.trim()} onClick={submit}>
            {submitting ? "Saving…" : isEdit ? "Save changes" : "Create record"}
          </button>
        </>
      }
    >
      {error && (
        <div className="mb-3 border-l-4 border-[#d13212] bg-[#fdf3f1] text-[#d13212] text-sm px-3 py-2 rounded-[3px]">
          {error}
        </div>
      )}
      <div className="space-y-3">
        <div>
          <label className="aws-label">Record name</label>
          {isEdit ? (
            <input className="aws-input bg-awsBg" value={record!.name} disabled />
          ) : (
            <div className="flex items-center gap-2">
              <input
                className="aws-input"
                placeholder="www (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <span className="text-sm text-awsGray whitespace-nowrap">.{zone.name}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="aws-label">Record type</label>
            <select
              className="aws-input"
              value={recordType}
              disabled={isEdit}
              onChange={(e) => setRecordType(e.target.value)}
            >
              {RECORD_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="aws-label">TTL (seconds)</label>
            <input
              type="number"
              min={0}
              className="aws-input"
              value={ttl}
              onChange={(e) => setTtl(parseInt(e.target.value || "0", 10))}
            />
          </div>
        </div>

        <div>
          <label className="aws-label">Routing policy</label>
          <select
            className="aws-input"
            value={routingPolicy}
            onChange={(e) => setRoutingPolicy(e.target.value)}
          >
            <option>Simple</option>
            <option>Weighted</option>
            <option>Latency</option>
            <option>Failover</option>
            <option>Geolocation</option>
            <option>Multivalue answer</option>
          </select>
        </div>

        <div>
          <label className="aws-label">Value(s)</label>
          <textarea
            className="aws-input font-mono text-xs"
            rows={4}
            placeholder={placeholderFor(recordType)}
            value={valuesText}
            onChange={(e) => setValuesText(e.target.value)}
          />
          <p className="text-xs text-awsGray mt-1">Enter one value per line.</p>
        </div>
      </div>
    </Modal>
  );
}

function placeholderFor(type: string): string {
  switch (type) {
    case "A":
      return "192.0.2.1";
    case "AAAA":
      return "2001:db8::1";
    case "CNAME":
      return "target.example.com.";
    case "TXT":
      return '"v=spf1 include:example.com ~all"';
    case "MX":
      return "10 mail.example.com.";
    case "NS":
      return "ns1.example.com.";
    case "PTR":
      return "host.example.com.";
    case "SRV":
      return "1 10 5269 target.example.com.";
    case "CAA":
      return '0 issue "letsencrypt.org"';
    default:
      return "";
  }
}

function DeleteRecordModal({
  zoneId,
  record,
  onClose,
  onDeleted,
}: {
  zoneId: string;
  record: DnsRecord;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const { notify } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    setSubmitting(true);
    try {
      await api.delete(`/api/hosted-zones/${zoneId}/records/${record.id}`);
      notify("success", "Record deleted", `${record.name} (${record.record_type}) deleted.`);
      onDeleted();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Delete record"
      onClose={onClose}
      footer={
        <>
          <button className="aws-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="bg-[#d13212] text-white hover:bg-[#a8280e] px-3.5 py-1.5 text-sm rounded-[3px]"
            disabled={submitting}
            onClick={submit}
          >
            {submitting ? "Deleting…" : "Delete"}
          </button>
        </>
      }
    >
      {error && (
        <div className="mb-3 border-l-4 border-[#d13212] bg-[#fdf3f1] text-[#d13212] text-sm px-3 py-2 rounded-[3px]">
          {error}
        </div>
      )}
      <p className="text-sm text-awsText">
        Are you sure you want to delete the record <strong>{record.name}</strong> ({record.record_type})?
        This action cannot be undone.
      </p>
    </Modal>
  );
}
