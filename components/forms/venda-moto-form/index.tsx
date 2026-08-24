'use client';

import React, { useState } from 'react';
import { useForm, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Form } from '@/components/ui/form';
import { sellRequestSchema, SellRequestInput } from '@/lib/validations/sell-request';
import {
  createSellRequestAction,
  uploadPublicSellRequestImageAction,
  SellRequestImageItem,
} from '@/lib/actions/leads';
import { VendaMotoStepper } from './venda-moto-stepper';
import { VendaMotoSummaryCard } from './venda-moto-summary-card';
import { Step1MotorcycleData } from './steps/step-1-motorcycle-data';
import { Step3OwnerContact } from './steps/step-3-owner-contact';
import { Step4PhotosUpload } from './steps/step-4-photos-upload';
import { Step5ReviewSubmit } from './steps/step-5-review-submit';
import { VendaMotoSuccessView } from './venda-moto-success-view';

const currentYear = new Date().getFullYear();

export function VendaMotoForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [maxStepReached, setMaxStepReached] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdProposalId, setCreatedProposalId] = useState<string | null>(null);

  // File and preview states
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  // FIPE internal tracking
  const [fipeBrandId, setFipeBrandId] = useState<string | null>(null);
  const [, setFipeModelId] = useState<string | null>(null);
  const [, setFipeYearId] = useState<string | null>(null);
  const [, setFipeFuelId] = useState<string | null>(null);
  const [, setFipeFuelName] = useState<string | null>(null);

  const form = useForm<SellRequestInput>({
    resolver: zodResolver(sellRequestSchema) as unknown as Resolver<SellRequestInput>,
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      brand: '',
      brand_id: null,
      model: '',
      model_id: null,
      year_manufacture: currentYear,
      year_model: currentYear,
      year_id: null,
      fuel_id: null,
      fuel_name: null,
      color: '',
      mileage: 0,
      desired_price: undefined,
      offer_percentage: undefined,
      estimated_offer: undefined,
      fipe_code: null,
      fipe_price: undefined,
      fipe_reference_period: null,
      fipe_snapshot: null,
      state: 'PE',
      city: '',
      notes: '',
    },
  });

  const goToStep = (stepNumber: number) => {
    setCurrentStep(stepNumber);
    if (stepNumber > maxStepReached) {
      setMaxStepReached(stepNumber);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFilesChange = (files: File[], newPreviews: string[]) => {
    setSelectedFiles(files);
    setPreviews(newPreviews);
  };

  const handleSubmitProposal = async () => {
    const isValid = await form.trigger();
    if (!isValid) {
      toast.error('Por favor, revise os campos do formulário antes de enviar.');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Enviando os dados da moto e fotos para a AF Motos...');

    try {
      // 1. Upload assíncrono das fotos
      const uploadedImages: SellRequestImageItem[] = [];

      if (selectedFiles.length > 0) {
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          const formData = new FormData();
          formData.append('file', file);

          const uploadRes = await uploadPublicSellRequestImageAction(formData);
          if (uploadRes.success && uploadRes.url) {
            uploadedImages.push({
              url: uploadRes.url,
              provider: uploadRes.image?.provider || 'supabase',
              storage_path: uploadRes.image?.storagePath || null,
              delete_url: uploadRes.image?.deleteUrl || null,
            });
          }
        }
      }

      // 2. Montar payload tipado
      const formValues = form.getValues();
      const payload = {
        ...formValues,
        images: uploadedImages,
      };

      // 3. Executar Server Action
      const result = await createSellRequestAction(payload);

      if (result.success) {
        toast.success('Dados enviados com sucesso!', { id: toastId });
        setCreatedProposalId(result.id || null);
        setIsSuccess(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        toast.error(result.error || 'Não foi possível enviar sua proposta.', { id: toastId });
      }
    } catch (err) {
      console.error('Erro na submissão da proposta de venda:', err);
      toast.error('Ocorreu um erro ao processar sua proposta. Tente novamente.', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    form.reset();
    setSelectedFiles([]);
    setPreviews([]);
    setFipeBrandId(null);
    setFipeModelId(null);
    setFipeYearId(null);
    setFipeFuelId(null);
    setFipeFuelName(null);
    setCurrentStep(1);
    setMaxStepReached(1);
    setIsSuccess(false);
    setCreatedProposalId(null);
  };

  // Watch fields for summary card
  const watchedBrand = form.watch('brand');
  const watchedModel = form.watch('model');
  const watchedYearModel = form.watch('year_model');
  const watchedYearManufacture = form.watch('year_manufacture');
  const watchedColor = form.watch('color');
  const watchedMileage = form.watch('mileage');
  const watchedCity = form.watch('city');
  const watchedDesired = form.watch('desired_price');

  if (isSuccess) {
    return (
      <VendaMotoSuccessView
        proposalId={createdProposalId}
        brand={watchedBrand}
        model={watchedModel}
        yearModel={watchedYearModel}
        name={form.getValues('name')}
        onReset={handleReset}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Stepper Superior */}
      <VendaMotoStepper
        currentStep={currentStep}
        maxStepReached={maxStepReached}
        onStepClick={goToStep}
      />

      {/* Main Grid: Form Left, Sticky Summary Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form Column (8 cols on desktop) */}
        <div className="lg:col-span-8 bg-zinc-900/70 backdrop-blur-xl border border-zinc-800/80 rounded-3xl p-5 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />

          <Form {...form}>
            <form onSubmit={(e) => e.preventDefault()}>
              {currentStep === 1 && (
                <Step1MotorcycleData
                  form={form}
                  onNext={() => goToStep(2)}
                  fipeBrandId={fipeBrandId}
                  setFipeBrandId={setFipeBrandId}
                  setFipeModelId={setFipeModelId}
                  setFipeYearId={setFipeYearId}
                  setFipeFuelId={setFipeFuelId}
                  setFipeFuelName={setFipeFuelName}
                />
              )}

              {currentStep === 2 && (
                <Step3OwnerContact
                  form={form}
                  onNext={() => goToStep(3)}
                  onPrev={() => goToStep(1)}
                />
              )}

              {currentStep === 3 && (
                <Step4PhotosUpload
                  selectedFiles={selectedFiles}
                  previews={previews}
                  onFilesChange={handleFilesChange}
                  onNext={() => goToStep(4)}
                  onPrev={() => goToStep(2)}
                />
              )}

              {currentStep === 4 && (
                <Step5ReviewSubmit
                  form={form}
                  previews={previews}
                  onPrev={() => goToStep(3)}
                  onSubmit={handleSubmitProposal}
                  isSubmitting={isSubmitting}
                />
              )}
            </form>
          </Form>
        </div>

        {/* Right Sticky Summary Column (Desktop only) */}
        <div className="hidden lg:block lg:col-span-4">
          <VendaMotoSummaryCard
            brand={watchedBrand}
            model={watchedModel}
            yearModel={watchedYearModel}
            yearManufacture={watchedYearManufacture}
            color={watchedColor}
            mileage={watchedMileage}
            city={watchedCity}
            desiredPrice={watchedDesired}
            photosCount={selectedFiles.length}
            currentStep={currentStep}
          />
        </div>
      </div>
    </div>
  );
}
