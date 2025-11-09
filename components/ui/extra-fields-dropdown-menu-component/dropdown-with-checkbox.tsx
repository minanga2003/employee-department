"use client";

import { Fragment, ReactNode, useMemo, useState, type MouseEvent } from "react";
import {
  Box,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuProps,
  Paper,
  Tooltip,
  Typography,
  TypographyProps,
  styled,
} from "@mui/material";
import { IconList } from "@tabler/icons-react";

import CustomCheckbox from "@/components/forms/checkbox/custom-checkbox";
import CustomDivider from "@/components/ui/divider/custom-divider";

const StyledMenu = styled((props: MenuProps) => (
  <Menu
    elevation={0}
    anchorOrigin={{
      vertical: "bottom",
      horizontal: "right",
    }}
    transformOrigin={{
      vertical: "top",
      horizontal: "right",
    }}
    {...props}
  />
))(({ theme }) => ({
  "& .MuiPaper-root": {
    borderRadius: 4,
    marginTop: 8,
    minWidth: 230,
    border: `1px solid ${theme.palette.grey[300]}`,
  },
}));

const StyledPaper = styled(Paper)(() => ({
  width: "100%",
  borderRadius: 4,
  boxShadow: "none",
  overflow: "hidden",
}));

const StyledButton = styled(Button)(({ theme }) => ({
  padding: 4,
  width: 30,
  minWidth: 30,
  height: 30,
  borderRadius: 3,
  fontSize: "1px",
  textTransform: "none",
  border: `1px solid ${theme.palette.primary.main}`,
  color: theme.palette.primary.main,
  backgroundColor: "transparent",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  "&:hover": {
    backgroundColor: theme.palette.primary.main,
    borderColor: theme.palette.primary.main,
    color: theme.palette.common.white,
  },
  "&:active": {
    backgroundColor: theme.palette.primary.dark,
    borderColor: theme.palette.primary.dark,
  },
  "&:focus": {
    boxShadow: `0 0 0 2px ${theme.palette.primary.light}`,
  },
  "& .MuiSvgIcon-root": {
    fontSize: "1rem",
    padding: 0,
    margin: 0,
  },
  "&.Mui-disabled": {
    borderColor: theme.palette.grey[200],
    "& .MuiSvgIcon-root": {
      color: theme.palette.grey[400],
    },
  },
}));

const StyledListItemButton = styled(ListItemButton)(({ theme }) => ({
  padding: "0px 16px",
  "&:hover": {
    backgroundColor: theme.palette.primary.light,
  },
  "&.Mui-selected": {
    backgroundColor: "transparent",
    "& .MuiTypography-root": {
      color: theme.palette.primary.main,
    },
    "&:hover": {
      backgroundColor: theme.palette.primary.light,
    },
  },
}));

const StyledItemText = styled(Typography, {
  shouldForwardProp: (prop) => prop !== "isSelected",
})<TypographyProps & { isSelected?: boolean }>(({ theme, isSelected }) => ({
  fontSize: "0.8rem",
  color: isSelected ? theme.palette.primary.main : theme.palette.text.primary,
}));

export type CheckboxItemProps = {
  label: ReactNode;
  onClick: () => void;
  divider?: boolean;
  isChecked?: boolean;
};

export type CheckboxListProps = {
  items: CheckboxItemProps[];
  title?: string;
};

const CheckboxList = ({ items, title = "Other Fields" }: CheckboxListProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(
    items.reduce((acc, item, index) => {
      acc[index] = Boolean(item?.isChecked);
      return acc;
    }, {} as Record<string, boolean>)
  );

  const handleToggle = (index: number) => {
    setCheckedItems((prev) => {
      const next = { ...prev, [index]: !prev[index] };
      items[index].onClick();
      return next;
    });
  };

  const selectedCount = useMemo(
    () => Object.values(checkedItems).filter(Boolean).length,
    [checkedItems]
  );

  const handleCheckboxClick = (event: MouseEvent, index: number) => {
    event.stopPropagation();
    handleToggle(index);
  };

  return (
    <>
      <Tooltip
        title="Select options"
        arrow
        slotProps={{
          popper: {
            modifiers: [
              {
                name: "preventOverflow",
                options: {
                  boundary: "window",
                },
              },
            ],
          },
          tooltip: {
            sx: {
              backgroundColor: (theme) => theme.palette.primary.main,
              color: (theme) => theme.palette.common.white,
            },
          },
          arrow: {
            sx: {
              color: (theme) => theme.palette.primary.main,
            },
          },
        }}
      >
        <StyledButton onClick={(event) => setAnchorEl(event.currentTarget)} disableRipple aria-label="Select options">
          <IconList />
        </StyledButton>
      </Tooltip>

      <StyledMenu anchorEl={anchorEl} open={open} onClose={() => setAnchorEl(null)}>
        <StyledPaper>
          <Box sx={{ pl: 1.5 }}>
            <Typography variant="subtitle1">{title}</Typography>
          </Box>
          <CustomDivider />
          <List disablePadding>
            {items.map((item, index) => (
              <Fragment key={index}>
                <ListItem dense disablePadding>
                  <StyledListItemButton
                    dense
                    selected={checkedItems[index]}
                    onClick={() => handleToggle(index)}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <CustomCheckbox
                        checked={checkedItems[index]}
                        disableRipple
                        onClick={(event) => handleCheckboxClick(event, index)}
                        size="small"
                      />
                    </ListItemIcon>
                    <ListItemText
                      id={`checkbox-list-label-${index}`}
                      primary={
                        <StyledItemText component="div" isSelected={checkedItems[index]}>
                          <Typography variant="subtitle1">{item.label}</Typography>
                        </StyledItemText>
                      }
                    />
                  </StyledListItemButton>
                </ListItem>
                {item.divider && <CustomDivider />}
              </Fragment>
            ))}
          </List>
          <CustomDivider />
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {selectedCount} of {items.length} selected
            </Typography>
          </Box>
        </StyledPaper>
      </StyledMenu>
    </>
  );
};

export default CheckboxList;

