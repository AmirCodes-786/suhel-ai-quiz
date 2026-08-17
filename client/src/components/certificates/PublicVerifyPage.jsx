import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Download, 
  Share2, 
  ExternalLink, 
  Zap,
  ArrowLeft,
  Award
} from 'lucide-react';
import api from '../../services/api';
import CertificateDocument from './CertificateDocument';
import { downloadCertificatePdf } from '../../utils/certificatePdf';
import { useToast } from '../../context/ToastContext';
import PageTransition from '../common/PageTransition';

export default function PublicVerifyPage() {
  const { code, id } = useParams();
  const certCode = code || id;
  const toast = useToast();

  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (certCode) {
      verifyCertificate(certCode);
    } else {
      setLoading(false);
      setError('No certificate ID provided in the URL.');
    }
  }, [certCode]);

  const verifyCertificate = async (codeToVerify) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/certificates/verify/${codeToVerify}`);
      if (res.data?.success && res.data.certificate) {
        setCertificate(res.data.certificate);
      } else {
        setError(res.data?.message || 'Certificate verification failed or credential does not exist.');
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Certificate with this credential ID could not be found.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!certificate) return;
    try {
      setIsDownloading(true);
      await downloadCertificatePdf({
        certificateId: certificate.certificateId,
        recipientName: certificate.recipientName,
        quizTitle: certificate.quizTitle,
        score: certificate.score,
        issueDate: certificate.issueDate
      });
      toast.success('Certificate PDF downloaded successfully.');
    } catch (e) {
      toast.error('Failed to generate certificate PDF.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Verification link copied to clipboard.');
  };

  return (
    <PageTransition className="min-h-screen bg-[#F8FAFC] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Brand Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <Link to="/" className="flex items-center gap-2 text-slate-900 font-bold tracking-tight text-sm">
            <div className="w-6 h-6 rounded-md bg-primary text-white flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 fill-white text-white" />
            </div>
            <span>QUIZFORGE AI</span>
          </Link>

          <Link
            to="/dashboard"
            className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Application
          </Link>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 shadow-subtle space-y-4">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-medium text-slate-600">Verifying credential on QuizForge ledger...</p>
          </div>
        )}

        {/* Error / Not Found State */}
        {!loading && error && (
          <div className="p-10 bg-white rounded-2xl border border-red-200 shadow-subtle text-center space-y-4 max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900">Certificate Not Verified</h2>
              <p className="text-xs text-slate-500">{error}</p>
            </div>
            <div className="pt-2">
              <Link
                to="/certificates"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors"
              >
                Go to Certificate Portal
              </Link>
            </div>
          </div>
        )}

        {/* Verified Certificate Display */}
        {!loading && certificate && (
          <div className="space-y-6">
            {/* Status Header Banner */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-emerald-200 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm sm:text-base font-bold text-slate-900">
                      Authentic Credential Verified
                    </h2>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                      Official Record
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    This certificate is verified by QuizForge AI.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isDownloading ? 'Generating PDF...' : 'Download PDF'}</span>
                </button>
                <button
                  onClick={handleCopyLink}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </button>
              </div>
            </div>

            {/* Document Viewer Frame */}
            <div className="bg-[#F5F5F3] p-4 sm:p-8 md:p-12 rounded-2xl border border-slate-200 flex items-center justify-center">
              <div className="w-full max-w-3xl">
                <CertificateDocument certificate={certificate} />
              </div>
            </div>

            {/* Credential Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-white border border-slate-200">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">Recipient</span>
                <span className="text-sm font-bold text-slate-900">{certificate.recipientName}</span>
              </div>
              <div className="p-4 rounded-xl bg-white border border-slate-200">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">Assessment</span>
                <span className="text-sm font-bold text-slate-900 truncate block" title={certificate.quizTitle}>
                  {certificate.quizTitle}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-white border border-slate-200">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">Verified Score</span>
                <span className="text-sm font-bold text-emerald-600">{certificate.score}%</span>
              </div>
              <div className="p-4 rounded-xl bg-white border border-slate-200">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">Credential ID</span>
                <span className="text-xs font-mono font-bold text-slate-700">{certificate.certificateId}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
