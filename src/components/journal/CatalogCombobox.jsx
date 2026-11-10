import OptionCombobox from './OptionCombobox';
export default function CatalogCombobox({onCreateOption,onUpdateOption,onDeleteOption,...props}) {
  return <OptionCombobox {...props} onCreate={onCreateOption} onUpdate={onUpdateOption} onDelete={onDeleteOption}/>;
}
