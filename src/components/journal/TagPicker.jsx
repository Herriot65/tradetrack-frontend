import OptionCombobox from './OptionCombobox';
export default function TagPicker({selected,onCreateTag,onUpdateTag,onDeleteTag,...props}) {
  return <OptionCombobox {...props} value={selected} multiple onCreate={onCreateTag} onUpdate={onUpdateTag} onDelete={onDeleteTag}/>;
}
