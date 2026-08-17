import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Award, 
  Search, 
  Download, 
  CheckCircle2, 
  ShieldCheck, 
  Eye, 
  Share2, 
  Calendar, 
  BookOpen, 
  X,
  Check,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { downloadCertificatePdf } from '../../utils/certificatePdf';
import CertificateDocument from './CertificateDocument';
import PageTransition from '../common/PageTransition';

export default function CertificateView() {
  const { user } = useAuth();
  const toast = useToast();
  const [searchParams] = useSearchParams();

  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifyCode, setVerifyCode] = useState(searchParams.get('verify') || '');
  const [verifyResult, setVerifyResult] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [activeModalCert, setActiveModalCert] = useState(null);
  const [copiedCertId, setCopiedCertId] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    fetchMyCertificates();
    if (searchParams.get('verify')) {
      handleVerifyCode(searchParams.get('verify'));
    }
  }, [user]);

  const fetchMyCertificates = async () => {
    try {
      setLoading(true);
      const res = await api.get('/certificates/my-certificates');
      if (res.data?.success && Array.isArray(res.data.certificates)) {
        setCertificates(res.data.certificates);
      } else {
        setCertificates([]);
      }
    } catch (e) {
      console.warn('Certificates fetch fallback:', e.message);
      setCertificates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (codeToVerify) => {
    const code = (codeToVerify || verifyCode).trim();
    if (!code) return;
    try {
      setIsVerifying(true);
      setVerifyResult(null);
      const res = await api.get(`/certificates/verify/${encodeURIComponent(code)}`);
      if (res.data?.success && res.data.valid) {
        setVerifyResult({
          valid: true,
          certificate: res.data.certificate
        });
        toast.success('Certificate verified successfully!');
      } else {
        setVerifyResult({
          valid: false,
          error: res.data?.message || 'Certificate ID was not found or is invalid.'
        });
      }
    } catch (e) {
      setVerifyResult({
        valid: false,
        error: e.response?.data?.message || 'Certificate ID was not found or is invalid.'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDownload = async (cert) => {
    if (!cert) return;
    try {
      setIsDownloading(true);
      await downloadCertificatePdf({
        certificateId: cert.certificateId,
        recipientName: cert.recipientName || user?.name || 'Student',
        quizTitle: cert.quizTitle,
        score: cert.score,
        issueDate: cert.issueDate
      });
      toast.success('Official Certificate PDF downloaded.');
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Failed to generate certificate PDF.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = (cert) => {
    const shareUrl = `${window.location.origin}/verify/${encodeURIComponent(cert.certificateId)}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedCertId(cert.certificateId);
    toast.success('Verification link copied to clipboard.');
    setTimeout(() => setCopiedCertId(null), 3000);
  };

  return (
    <PageTransition className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Accreditation
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Certificates
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Official verified credentials earned from scoring 80% or higher on assessments.
          </p>
        </div>

        <Link
          to="/library"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-xs transition-all hover:scale-[1.01] active:scale-[0.98] self-start sm:self-auto"
        >
          <BookOpen className="w-4 h-4" />
          <span>Earn New Certificate</span>
        </Link>
      </div>

      {/* Verification Search Bar */}
      <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-subtle space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
            Certificate Verification Portal
          </h2>
        </div>
        <p className="text-xs text-slate-500">
          Enter any credential ID to verify its authenticity, recipient, and official accreditation details.
        </p>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleVerifyCode()}
              placeholder="e.g. QF-AI-2026-987654"
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono uppercase text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-primary transition-all"
            />
          </div>
          <button
            onClick={() => handleVerifyCode()}
            disabled={isVerifying || !verifyCode.trim()}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5 shrink-0"
          >
            {isVerifying ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5" />
            )}
            <span>Verify</span>
          </button>
        </div>

        {/* Verification Result Preview */}
        {verifyResult && (
          <div className={`p-4 rounded-lg border text-xs transition-all ${
            verifyResult.valid ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'
          }`}>
            {verifyResult.valid ? (
              <div className="space-y-2">
                <div className="font-semibold flex items-center gap-1.5 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Authentic Credential Verified
                </div>
                <p className="text-emerald-700">
                  Awarded to <strong>{verifyResult.certificate.recipientName}</strong> for completing{' '}
                  <span className="font-semibold">{verifyResult.certificate.quizTitle}</span> with a score of{' '}
                  <strong>{verifyResult.certificate.score}%</strong>.
                </p>
                <div className="flex items-center gap-4 pt-1">
                  <span className="font-mono text-[11px] text-emerald-700">
                    ID: {verifyResult.certificate.certificateId}
                  </span>
                  <Link
                    to={`/verify/${verifyResult.certificate.certificateId}`}
                    className="text-[11px] font-semibold text-emerald-800 underline flex items-center gap-1"
                  >
                    View Official Verification Page <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-700">
                <X className="w-4 h-4 text-red-600 shrink-0" />
                <span>{verifyResult.error}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Certificates Content */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Loading your certificates...</p>
        </div>
      ) : certificates.length === 0 ? (
        /* Empty State */
        <div className="p-12 rounded-xl border border-slate-200 bg-white text-center space-y-4 shadow-subtle max-w-md mx-auto my-8">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Award className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-slate-800">
              No certificates yet.
            </h3>
            <p className="text-xs text-slate-500">
              Complete eligible quizzes to earn certificates.
            </p>
          </div>
          <Link
            to="/library"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Browse Quiz Library</span>
          </Link>
        </div>
      ) : (
        /* Certificates Grid */
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-800">
            Earned Certificates ({certificates.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {certificates.map((cert) => (
              <div
                key={cert._id || cert.id || cert.certificateId}
                className="p-5 rounded-xl border border-slate-200 bg-white shadow-subtle hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Award className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200 font-serif">
                      Score: {cert.score}%
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold font-serif text-slate-900 leading-snug">
                      {cert.quizTitle}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Recipient: <span className="font-medium text-slate-800">{cert.recipientName || user?.name || 'Student'}</span>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1 text-[11px]">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {cert.issueDate}
                    </span>
                    <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                      {cert.certificateId}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => setActiveModalCert(cert)}
                    className="flex-1 py-1.5 px-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                    title="View Certificate"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span>View</span>
                  </button>

                  <button
                    onClick={() => handleDownload(cert)}
                    disabled={isDownloading}
                    className="flex-1 py-1.5 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                    title="Download Official PDF"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isDownloading ? 'Generating...' : 'Download PDF'}</span>
                  </button>

                  <button
                    onClick={() => handleShare(cert)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
                    title="Copy Verification Link"
                  >
                    {copiedCertId === cert.certificateId ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Share2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DOCUMENT VIEWER PREVIEW MODAL */}
      <AnimatePresence>
        {activeModalCert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative w-full max-w-4xl max-h-[95vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
            >
              {/* Modal Document Header */}
              <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-slate-900" />
                  <span className="text-xs font-bold text-slate-900">Certificate Document Viewer</span>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    {activeModalCert.certificateId}
                  </span>
                </div>
                <button
                  onClick={() => setActiveModalCert(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Document Workspace (Neutral #F5F5F3 surrounding background) */}
              <div className="p-4 sm:p-8 bg-[#F5F5F3] overflow-y-auto flex items-center justify-center min-h-[350px]">
                <div className="w-full max-w-3xl">
                  <CertificateDocument certificate={activeModalCert} />
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="px-6 py-3.5 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                <Link
                  to={`/verify/${activeModalCert.certificateId}`}
                  target="_blank"
                  className="text-xs text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1"
                >
                  Open Public Verification Page <ExternalLink className="w-3 h-3" />
                </Link>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => handleShare(activeModalCert)}
                    className="px-3.5 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    {copiedCertId === activeModalCert.certificateId ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Share2 className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedCertId === activeModalCert.certificateId ? 'Link Copied!' : 'Copy Verification Link'}</span>
                  </button>
                  <button
                    onClick={() => handleDownload(activeModalCert)}
                    disabled={isDownloading}
                    className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isDownloading ? 'Generating PDF...' : 'Download Official PDF'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
