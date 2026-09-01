import { memo } from "react";
import { AssetModal } from "./AssetModal";
import { TicketModal } from "./TicketModal";
import type { ITAsset, AssetFormState, TicketFormState } from "../../types";

interface ITModalsContainerProps {
  assetModal: boolean;
  setAssetModal: (val: boolean) => void;
  editingAsset: ITAsset | null;
  setEditingAsset: (val: ITAsset | null) => void;
  assetForm: AssetFormState;
  setAssetForm: React.Dispatch<React.SetStateAction<AssetFormState>>;
  savingAsset: boolean;
  employees: any[];
  branches: any[];
  handleSaveAssetEdit: (e: React.FormEvent) => void;
  handleCreateAsset: (e: React.FormEvent) => void;

  ticketModal: boolean;
  setTicketModal: (val: boolean) => void;
  ticketForm: TicketFormState;
  setTicketForm: React.Dispatch<React.SetStateAction<TicketFormState>>;
  savingTicket: boolean;
  handleCreateTicket: (e: React.FormEvent) => void;
}

export const ITModalsContainer = memo(function ITModalsContainer(props: ITModalsContainerProps) {
  return (
    <>
      <AssetModal
        isOpen={props.assetModal}
        onClose={() => {
          props.setAssetModal(false);
          props.setEditingAsset(null);
        }}
        editingAsset={props.editingAsset}
        assetForm={props.assetForm}
        setAssetForm={props.setAssetForm}
        saving={props.savingAsset}
        employees={props.employees}
        branches={props.branches}
        onSubmit={props.editingAsset ? props.handleSaveAssetEdit : props.handleCreateAsset}
      />

      <TicketModal
        isOpen={props.ticketModal}
        onClose={() => props.setTicketModal(false)}
        ticketForm={props.ticketForm}
        setTicketForm={props.setTicketForm}
        saving={props.savingTicket}
        onSubmit={props.handleCreateTicket}
      />
    </>
  );
});
