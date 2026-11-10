import OptionCombobox from './OptionCombobox';
export default function AssetCombobox({onCreateAsset,onUpdateAsset,onDeleteAsset,...props}) {
  return <OptionCombobox {...props} label="Asset" placeholder="Select or type an asset…" uppercase maxLength={50} onCreate={onCreateAsset} onUpdate={onUpdateAsset} onDelete={onDeleteAsset}/>;
}
