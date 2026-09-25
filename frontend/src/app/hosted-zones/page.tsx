"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import ProtectedLayout from "@/components/ProtectedLayout";
import Modal from "@/components/Modal";
import Pagination from "@/components/Pagination";
import { api, apiErrorMessage } from "@/lib/api";
import { useToast } from "@/lib/toast-context";
import { HostedZone, HostedZoneList } from "@/types";

export default function HostedZonesPage() {
  const { notify } = useToast();
  const [zones, setZones] = useState<HostedZone[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState<HostedZone | null>(null);
  const [showDelete, setShowDelete] = useState<HostedZone | null>(null);

  const fetchZones = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<HostedZoneList>("/api/hosted-zones", {
        params: { page, page_size: pageSize, search: search || undefined },
      });
      setZones(res.data.items);
      setTotal(res.data.total);
    } catch (err) {
      notify("error", "Failed to load hosted zones", apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, search, notify]);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const toggleSelect = (id: string) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <ProtectedLayout>
      <div className="p-6">
        <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-awsText">Hosted zones</h1>
            <p className="text-sm text-awsGray mt-0.5">
              A hosted zone is a container for records, which include information about how you
              want to route traffic for a domain.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              className="aws-btn-danger-text"
              disabled={selected.size === 0}
              onClick={() => {
                const z = zones.find((z) => selected.has(z.id));
                if (z) setShowDelete(z);
              }}
            >
              Delete
            </button>
            <button className="aws-btn-primary" onClick={() => setShowCreate(true)}>
              Create hosted zone
            </button>
          </div>
        </div>

        <div className="aws-panel">
          <div className="flex items-center gap-2 p-3 border-b border-awsBorder">
            <input
              className="aws-input max-w-sm"
              placeholder="Search hosted zones by name or ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span className="text-sm text-awsGray ml-auto">{total} hosted zone(s)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full aws-table">
              <thead>
                <tr>
                  <th className="w-8"></th>
                  <th>Domain name</th>
                  <th>Hosted zone ID</th>
                  <th>Type</th>
                  <th>Record count</th>
                  <th>Comment</th>
                  <th className="w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={7} className="text-center text-awsGray py-6">
                      Loading…
                    </td>
                  </tr>
                )}
                {!loading && zones.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-awsGray py-8">
                      No hosted zones found. Create one to get started.
                    </td>
                  </tr>
                )}
                {!loading &&
                  zones.map((zone) => (
                    <tr key={zone.id} className="hover:bg-[#fafafa]">
                      <td>
                        <input
                          type="checkbox"
                          checked={selected.has(zone.id)}
                          onChange={() => toggleSelect(zone.id)}
                        />
                      </td>
                      <td>
                        <Link href={`/hosted-zones/${zone.id}`} className="text-awsBlue hover:underline font-medium">
                          {zone.name}
                        </Link>
                      </td>
                      <td className="text-awsGray font-mono text-xs">{zone.id}</td>
                      <td>{zone.private_zone ? "Private" : "Public"}</td>
                      <td>{zone.record_count}</td>
                      <td className="text-awsGray">{zone.comment || "—"}</td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            className="text-awsBlue hover:underline text-xs"
                            onClick={() => setShowEdit(zone)}
                          >
                            Edit
                          </button>
                          <button
                            className="text-[#d13212] hover:underline text-xs"
                            onClick={() => setShowDelete(zone)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
        </div>
      </div>

      {showCreate && (
        <CreateZoneModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            fetchZones();
          }}
        />
      )}

      {showEdit && (
        <EditZoneModal
          zone={showEdit}
          onClose={() => setShowEdit(null)}
          onSaved={() => {
            setShowEdit(null);
            fetchZones();
          }}
        />
      )}

      {showDelete && (
        <DeleteZoneModal
          zone={showDelete}
          onClose={() => setShowDelete(null)}
          onDeleted={() => {
            setShowDelete(null);
            setSelected(new Set());
            fetchZones();
          }}
        />
      )}
    </ProtectedLayout>
  );
}

function CreateZoneModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { notify } = useToast();
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [privateZone, setPrivateZone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    setSubmitting(true);
    try {
      await api.post("/api/hosted-zones", { name, comment, private_zone: privateZone });
      notify("success", "Hosted zone created", `${name} has been created.`);
      onCreated();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Create hosted zone"
      onClose={onClose}
      footer={
        <>
          <button className="aws-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="aws-btn-primary" disabled={!name || submitting} onClick={submit}>
            {submitting ? "Creating…" : "Create hosted zone"}
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
          <label className="aws-label">Domain name</label>
          <input
            className="aws-input"
            placeholder="example.com"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <p className="text-xs text-awsGray mt-1">
            This is the name of the domain that you want Route 53 to route traffic for.
          </p>
        </div>
        <div>
          <label className="aws-label">Comment</label>
          <textarea
            className="aws-input"
            rows={2}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
        <div>
          <label className="aws-label">Type</label>
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-1.5">
              <input type="radio" checked={!privateZone} onChange={() => setPrivateZone(false)} />
              Public hosted zone
            </label>
            <label className="flex items-center gap-1.5">
              <input type="radio" checked={privateZone} onChange={() => setPrivateZone(true)} />
              Private hosted zone
            </label>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function EditZoneModal({
  zone,
  onClose,
  onSaved,
}: {
  zone: HostedZone;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { notify } = useToast();
  const [comment, setComment] = useState(zone.comment);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    setSubmitting(true);
    try {
      await api.put(`/api/hosted-zones/${zone.id}`, { comment });
      notify("success", "Hosted zone updated");
      onSaved();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={`Edit hosted zone details`}
      onClose={onClose}
      footer={
        <>
          <button className="aws-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="aws-btn-primary" disabled={submitting} onClick={submit}>
            {submitting ? "Saving…" : "Save changes"}
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
          <label className="aws-label">Domain name</label>
          <input className="aws-input bg-awsBg" value={zone.name} disabled />
        </div>
        <div>
          <label className="aws-label">Comment</label>
          <textarea
            className="aws-input"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}

function DeleteZoneModal({
  zone,
  onClose,
  onDeleted,
}: {
  zone: HostedZone;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const { notify } = useToast();
  const [confirmText, setConfirmText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    setSubmitting(true);
    try {
      await api.delete(`/api/hosted-zones/${zone.id}`);
      notify("success", "Hosted zone deleted", `${zone.name} has been deleted.`);
      onDeleted();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Delete hosted zone"
      onClose={onClose}
      footer={
        <>
          <button className="aws-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="aws-btn-danger-text bg-[#d13212] text-white hover:bg-[#a8280e]"
            disabled={confirmText !== zone.name || submitting}
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
      <p className="text-sm text-awsText mb-3">
        This will permanently delete the hosted zone <strong>{zone.name}</strong> and all{" "}
        {zone.record_count} record(s) within it. This action cannot be undone.
      </p>
      <label className="aws-label">
        Type <span className="font-mono">{zone.name}</span> to confirm
      </label>
      <input
        className="aws-input"
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
      />
    </Modal>
  );
}
